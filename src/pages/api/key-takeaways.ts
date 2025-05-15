import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import { flattenResume } from '@/lib/scoreEngine';
import type { ResumeData } from '@/types/resume';
// LLM client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// Key takeaway type
type Takeaway = { title: string; description: string; level: 'info'|'success'|'warning'|'error' };
export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const { runId } = req.body as { runId?: string };
  if (!runId) return res.status(400).json({ error: 'Missing runId' });
  const run = await prisma.optimizationRun.findUnique({ where: { id: runId }, select: { userId: true, jobDescription: true, optimizedText: true } });
  if (!run) return res.status(404).json({ error: 'Run not found' });
  if (run.userId !== userId) return res.status(403).json({ error: 'Forbidden' });
  const scorecard = await prisma.scorecard.findUnique({ where: { optimizationRunId: runId }, select: { metrics: true } });
  if (!scorecard) return res.status(404).json({ error: 'Scorecard not found' });
  const metricsArray: any[] = Array.isArray(scorecard.metrics)
    ? scorecard.metrics as any[]
    : JSON.parse(scorecard.metrics as string);
  let optFlat = '';
  try { optFlat = flattenResume(JSON.parse(run.optimizedText) as ResumeData); } catch {}
  // System prompt for LLM-driven key takeaways
  const systemPrompt = `
You are a helpful and realistic resume optimization assistant.
You evaluate a candidate’s optimized resume, job description, and performance metrics.
Your job is to generate three concise, realistic, and insightful takeaways to help the user improve their resume alignment.
Each takeaway must include a title, a short description, and a severity level.
Avoid repeating metric names or raw scores—give natural-language feedback that a hiring manager or resume coach might provide.
ONLY return structured JSON.
`.trim();

  // Build the user prompt with context and detailed instructions
  const metricsText = metricsArray.map(m => `${m.name}: orig=${m.originalScore}, opt=${m.optimizedScore}`).join('\n');
  const userPrompt = `
Job Description:
${run.jobDescription}

Optimized Resume:
${optFlat}

Score Metrics:
${metricsText}

Instructions:
- Use score improvements to highlight success (e.g., +60% bullet strength).
- Use job description language to identify missing themes or opportunities.
- Title should summarize the insight in 5–8 words.
- Description should be 1–2 sentences long.
- Level must be one of: 'info', 'success', 'warning', or 'error'.
- Focus on narrative-level insights, not raw numbers.

Return exactly 3 items as a JSON array in this shape:
[{title: string, description: string, level: "info"|"success"|"warning"|"error"}]
`.trim();
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
    });
    const text = response.choices?.[0]?.message?.content || '[]';
    const match = text.match(/\[[\s\S]*\]/);
    const takeaways = match ? JSON.parse(match[0]) as Takeaway[] : [];
    // Persist takeaways to scorecard
    try {
      await prisma.scorecard.update({
        where: { optimizationRunId: runId },
        data: { takeaways }
      });
    } catch (e) {
      console.error('[key-takeaways] Error updating scorecard:', e);
    }
    return res.status(200).json({ takeaways });
  } catch (err) {
    console.error('[key-takeaways]', err);
    return res.status(500).json({ takeaways: [] });
  }
}