import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import DiffMatchPatch from 'diff-match-patch';
import type { RewriteSummaryResponse } from '@/types/resume';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const dmp = new DiffMatchPatch();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  const {
    originalSummary,
    optimizedBullets,
    skills,
    targetTitle,
    targetCompany,
    requirements,
    keywords,
    jobDescription,
    experienceSnapshot,
  } = req.body as {
    originalSummary?: string;
    optimizedBullets?: string[];
    skills?: string[];
    targetTitle?: string;
    targetCompany?: string;
    requirements?: string[];
    keywords?: string[];
    jobDescription?: string;
    experienceSnapshot?: string;
  };
  if (
    typeof originalSummary !== 'string' ||
    !Array.isArray(optimizedBullets) ||
    !Array.isArray(skills) ||
    typeof targetTitle !== 'string' ||
    typeof targetCompany !== 'string' ||
    !Array.isArray(requirements) ||
    !Array.isArray(keywords) ||
    typeof jobDescription !== 'string' ||
    (experienceSnapshot !== undefined && typeof experienceSnapshot !== 'string')
  ) {
    return res.status(400).json({ error: 'Invalid request payload' });
  }
  try {
    const systemPrompt = `
You are an elite resume editor rewriting a professional summary.

Your task is to optimize the summary to better align with a target role, using the revised work experience bullets and job description as context.

Guidelines:
- Write in a concise, third-person style (no "I", no first person)
- Begin with a powerful, differentiated positioning statement — avoid weak openings like 'Experienced professional'. For example: “Award-winning enterprise sales leader” or “Strategic revenue executive” to immediately convey value.
- Write 3–4 value-dense sentences totaling around 60–80 words; each sentence must add unique value
- Use tone and language appropriate for a seasoned ${targetTitle}, emphasizing strategic impact, technical depth, or leadership contributions as appropriate
- Highlight alignment with the target role based on skills, achievements, and responsibilities — but do not mention the target company or job title directly
- Weave in keywords naturally **only where they enhance clarity or relevance**; avoid keyword stuffing or listing too many tools
- Limit hard skill/tool name-dropping to 2–3 maximum, only if central to the candidate's value
- Do NOT include a separate skills section
- Do NOT fabricate experience or exaggerate impact
- Return only the rewritten summary — no labels, no headers, no quotes, no extra formatting
`.trim();
    const userPrompt = `
ORIGINAL SUMMARY:
${originalSummary}

TARGET ROLE:
- Title: ${targetTitle}
- Company: ${targetCompany}
- Requirements: ${requirements.join('; ')}

KEYWORDS TO INCORPORATE:
${keywords.join(', ')}

EXPERIENCE SNAPSHOT:
${experienceSnapshot}

OPTIMIZED BULLETS:
${optimizedBullets.join('\n')}

FULL JOB DESCRIPTION:
${jobDescription}
`.trim();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini-2025-04-14',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });
    let rewritten = completion.choices[0]?.message?.content?.trim() || '';
    if (
      (rewritten.startsWith('"') && rewritten.endsWith('"')) ||
      (rewritten.startsWith("'") && rewritten.endsWith("'"))
    ) {
      rewritten = rewritten.slice(1, -1).trim();
    }
    const diffs = dmp.diff_main(originalSummary, rewritten);
    dmp.diff_cleanupSemantic(diffs);
    const diffHtml = dmp.diff_prettyHtml(diffs);
    const keywordsUsed = keywords.filter(k =>
      rewritten.toLowerCase().includes(k.toLowerCase())
    );
    const result: RewriteSummaryResponse = { rewrittenSummary: rewritten };
    return res.status(200).json({ ...result, originalSummary, keywordsUsed, diff: diffHtml });
  } catch (error) {
    console.error('Error in rewrite-summary API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}