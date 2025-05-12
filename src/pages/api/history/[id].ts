import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

/**
 * GET: fetch details for a single run
 * DELETE: remove a run
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const {
    query: { id },
    method
  } = req;
  // Authenticate user
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const runId = Array.isArray(id) ? id[0] : id;
  if (method === 'GET') {
    try {
      const run = await prisma.optimizationRun.findFirst({
        where: { id: runId, userId, deletedAt: null }
      });
      if (!run) {
        return res.status(404).json({ error: 'Not found' });
      }
      // Parse stored JSON
      const original = JSON.parse(run.originalText);
      const optimized = JSON.parse(run.optimizedText);
      return res.status(200).json({
        runId: run.id,
        jobDescription: run.jobDescription,
        templateId: parseInt(run.templateId, 10) || 1,
        originalResume: original,
        optimizedResume: optimized,
        keywords: run.keywords,
        requirements: run.requirements,
        targetTitle: run.targetTitle,
        targetCompany: run.targetCompany
      });
    } catch (error) {
      console.error('Error fetching run detail:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else if (method === 'DELETE') {
    try {
      const result = await prisma.optimizationRun.updateMany({
        where: { id: runId, userId, deletedAt: null },
        data: { deletedAt: new Date() }
      });
      if (result.count === 0) {
        return res.status(404).json({ error: 'Not found' });
      }
      return res.status(204).end();
    } catch (error) {
      console.error('Error deleting run:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'DELETE']);
    return res.status(405).end(`Method ${method} Not Allowed`);
  }
}