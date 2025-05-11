import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  if (req.method === 'GET') {
    try {
      const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
    const record = await prisma.savedResume.findUnique({
        where: { id, userId },
        select: { id: true, name: true, content: true, parsedData: true, createdAt: true }
      });
      if (!record) {
        return res.status(404).json({ error: 'Not found' });
      }
      return res.status(200).json(record);
    } catch (err) {
      console.error('Error fetching saved resume:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  if (req.method === 'DELETE') {
    try {
      const result = await prisma.savedResume.deleteMany({ where: { id, userId } });
      if (result.count === 0) {
        return res.status(404).json({ error: 'Not found' });
      }
      return res.status(204).end();
    } catch (err) {
      console.error('Error deleting saved resume:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  res.setHeader('Allow', ['DELETE']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}