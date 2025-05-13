import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
  const { userId } = getAuth(req);
  let dbUserId = userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // Ensure user record exists and get DB user ID
  try {
    const client = await clerkClient();
    const userRecord = await client.users.getUser(userId);
    const email = userRecord.emailAddresses[0]?.emailAddress || '';
    const fullName = `${userRecord.firstName || ''} ${userRecord.lastName || ''}`.trim();
    let dbUser = await prisma.user.findUnique({ where: { id: userId } });
    if (dbUser) {
      await prisma.user.update({ where: { id: userId }, data: { email, fullName } });
    } else {
      const emailUser = await prisma.user.findUnique({ where: { email } });
      if (emailUser) {
        await prisma.user.update({ where: { email }, data: { fullName } });
        dbUserId = emailUser.id;
      } else {
        await prisma.user.create({ data: { id: userId, email, fullName } });
      }
    }
  } catch (err) {
    console.error('[cover-letters/download] Error upserting user:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
  const runId = Array.isArray(req.query.runId) ? req.query.runId[0] : req.query.runId;
  if (!runId) {
    return res.status(400).json({ error: 'Missing runId parameter' });
  }
  try {
    const cover = await prisma.coverLetter.findUnique({ where: { optimizationRunId: runId } });
    if (!cover || cover.userId !== dbUserId) {
      return res.status(404).json({ error: 'Cover letter not found' });
    }
    // Build DOCX
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: cover.letterText.split(/\n{2,}/g).map((para) =>
            new Paragraph({
              alignment: AlignmentType.LEFT,
              spacing: { after: 200 },
              children: [new TextRun({ text: para })],
            })
          ),
        },
      ],
    });
    const buffer = await Packer.toBuffer(doc);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    res.setHeader('Content-Disposition', 'attachment; filename="cover-letter.docx"');
    res.send(buffer);
  } catch (err) {
    console.error('[cover-letters/download] Error:', err);
    // @ts-ignore
    return res.status(500).json({ error: err?.message || 'Internal server error' });
  }
}