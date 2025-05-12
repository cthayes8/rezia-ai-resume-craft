import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import { wrapCoverLetterContent } from '@/lib/wrapCoverLetterContent';

// Initialize OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
  // Authenticate via Clerk on Pages API
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const { runId, tone } = req.body as { runId?: string; tone?: string };
    if (!runId) {
      return res.status(400).json({ error: 'Missing runId' });
    }
    // Prevent duplicate generation
    const existing = await prisma.coverLetter.findUnique({ where: { optimizationRunId: runId } });
    if (existing) {
      return res.status(200).json({ coverLetterId: existing.id });
    }
    // Fetch the optimization run
    const run = await prisma.optimizationRun.findUnique({ where: { id: runId } });
    if (!run || run.userId !== userId) {
      return res.status(404).json({ error: 'Run not found' });
    }
    // Build the system prompt for cover letter
    const systemPrompt = `
You are an expert cover letter writer helping a candidate apply to a specific job.

Your task is to write a compelling, concise cover letter (under 300 words) that follows this structure:
1. A strong opening that mentions the role, expresses enthusiasm, and hooks the reader with a unique positioning.
2. A paragraph that highlights 2–3 specific achievements or traits from the candidate's experience that align with the role.
3. A paragraph that reflects knowledge of the company’s goals, culture, or impact — and connects the candidate’s values or vision.
4. A brief, polite closing with a thank you and clear interest in interviewing.

Rules:
- Match the tone to: ${tone || 'professional'}
- Do NOT repeat the resume verbatim — synthesize and narrate
- Personalize the content to the company’s mission, product, or culture
- Avoid generic phrases like “I am writing to express interest”
- Use vivid, persuasive language — show passion and ownership
- Output only the body of the letter — no headers, dates, or contact info
`.trim();

    // Build the user prompt with key data
    // Extract top 5 rewritten bullets
    const bullets: string[] = Array.isArray(run.bulletRewrites)
      ? (run.bulletRewrites as any[]).map((b) => b.rewrittenBullet).slice(0, 5)
      : [];
    const userPrompt = `
Candidate Summary:
${run.summaryRewrite}

Relevant Experience:
${bullets.join('\n')}

Job Description:
${run.jobDescription}

Company Name:
${run.targetCompany}

Role:
${run.targetTitle}
`.trim();
    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
    });
    const aiBody = completion.choices[0]?.message?.content?.trim();
    if (!aiBody) {
      throw new Error('No response from AI');
    }
    // Fetch user details for wrapping
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const userName = user?.fullName?.trim() ||
      `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
    const userEmail = user?.email;
    // Wrap with greeting and sign-off
    const wrapped = wrapCoverLetterContent({
      body: aiBody,
      companyName: run.targetCompany,
      userName,
      userEmail,
    });
    // Persist wrapped letter text in DB
    const record = await prisma.coverLetter.create({
      data: { userId, optimizationRunId: runId, letterText: wrapped }
    });
    // Return the new record ID
    return res.status(200).json({ coverLetterId: record.id });
  } catch (err) {
    console.error('[generate-cover-letter] Error:', err);
    // @ts-ignore: err may not have message property
    return res.status(500).json({ error: err?.message || 'Internal server error' });
  }
}