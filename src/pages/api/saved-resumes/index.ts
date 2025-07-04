import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// GET: list saved resumes; POST: save a new resume (max 3)
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = getAuth(req);
  // Track the actual User.id in DB (may differ if merging by email)
  let dbUserId = userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // Ensure user record exists without violating unique email constraints
  try {
    const client = await clerkClient();
    const userRecord = await client.users.getUser(userId);
    const email = userRecord.emailAddresses[0]?.emailAddress || '';
    const fullName = `${userRecord.firstName || ''} ${userRecord.lastName || ''}`.trim();
    let dbUser = await prisma.user.findUnique({ where: { id: userId } });
    if (dbUser) {
      await prisma.user.update({
        where: { id: userId },
        data: { email, fullName },
      });
    } else {
      const emailUser = await prisma.user.findUnique({ where: { email } });
      if (emailUser) {
        // Existing user by email: update fullName and use their id
        await prisma.user.update({ where: { email }, data: { fullName } });
        dbUserId = emailUser.id;
      } else {
        // Create new user with Clerk ID
        await prisma.user.create({ data: { id: userId, email, fullName } });
      }
    }
  } catch (e) {
    console.error('Error upserting user before saving resume:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
  if (req.method === 'GET') {
    try {
      const saved = await prisma.savedResume.findMany({
        where: { userId: dbUserId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, content: true, textHash: true, parsedData: true, createdAt: true }
      });
      return res.status(200).json(saved);
    } catch (err) {
      console.error('Error fetching saved resumes:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  if (req.method === 'POST') {
    const { name, content } = req.body;
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Missing content' });
    }
    // Remove any null bytes from PDF-extracted text
    const cleanContent = content.replace(/\u0000/g, '');
    try {
      // Enforce limit
      const count = await prisma.savedResume.count({ where: { userId: dbUserId } });
      if (count >= 3) {
        return res.status(400).json({ error: 'Maximum of 3 saved resumes reached' });
      }
      // Compute text hash for caching
      const crypto = await import('crypto');
      const normalized = cleanContent.replace(/\s+/g, ' ').trim();
      const textHash = crypto.createHash('sha256').update(normalized).digest('hex');
      // Parse resume via LLM API to get structured data
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers.host;
      // Parse resume via LLM API to get structured data
      const parseRes = await fetch(`${protocol}://${host}/api/parse-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume: cleanContent }),
      });
      if (!parseRes.ok) {
        throw new Error('Failed to parse resume for caching');
      }
      const { parsedResume } = await parseRes.json();
      // Persist saved resume with parsed data
      // Persist saved resume with sanitized content
      const saved = await prisma.savedResume.create({
        data: { userId: dbUserId, name: name || `Resume ${count + 1}`, content: cleanContent, textHash, parsedData: parsedResume }
      });
      return res.status(201).json(saved);
    } catch (err: any) {
      console.error('Error saving resume:', err);
      return res.status(500).json({ error: err.message || 'Internal server error' });
    }
  }
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}