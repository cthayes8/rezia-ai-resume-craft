import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// GET: list saved resumes; POST: save a new resume (max 3)
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (req.method === 'GET') {
    try {
      const saved = await prisma.savedResume.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, content: true, createdAt: true }
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
    try {
      const count = await prisma.savedResume.count({ where: { userId } });
      if (count >= 3) {
        return res.status(400).json({ error: 'Maximum of 3 saved resumes reached' });
      }
      const saved = await prisma.savedResume.create({
        data: { userId, name: name || `Resume ${count + 1}`, content }
      });
      return res.status(201).json(saved);
    } catch (err) {
      console.error('Error saving resume:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}