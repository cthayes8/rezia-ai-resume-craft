import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import DiffMatchPatch from 'diff-match-patch';
import type { RewriteBulletResponse } from '@/types/resume';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const dmp = new DiffMatchPatch();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  const {
    bullet,
    keywords,
    jobTitle,
    company,
    jobDescription,
    skills,
    targetTitle,
    targetCompany,
    requirements,
    usedVerbs,
  } = req.body as {
    bullet?: string;
    keywords?: string[];
    jobTitle?: string;
    company?: string;
    jobDescription?: string;
    skills?: string[];
    targetTitle?: string;
    targetCompany?: string;
    requirements?: string[];
    usedVerbs?: string[];
  };
  const avoidVerbs: string[] = Array.isArray(usedVerbs) ? usedVerbs : [];
  if (
    typeof bullet !== 'string' ||
    !Array.isArray(keywords) ||
    typeof jobTitle !== 'string' ||
    typeof company !== 'string' ||
    typeof jobDescription !== 'string'
  ) {
    return res.status(400).json({ error: 'Invalid request payload' });
  }
  try {
    const systemPrompt = `
You are a world-class resume editor.

Your task is to rewrite a single work experience bullet so it is more impactful and better aligned with a specific job description.

Rules:
- Start with a strong action verb.
- Use a wide range of strong action verbs; avoid repeating the same verb across bullets.
- Do not start the bullet with any of these verbs: ${avoidVerbs.join(', ') || 'none'}.
- Include quantifiable outcomes where possible.
- Improve clarity and brevity.
- Weave in the assigned keywords **only where they enhance the clarity or relevance of the bullet** — avoid awkward insertions or keyword stuffing.
- Consider the job requirements when rewriting to best tailor language to the role.
- Never force keywords or make up responsibilities.
- Preserve the original intent and scope of the bullet.
- Respond with exactly one sentence. No preambles. No explanations. Just the improved bullet.
- Align tone and language with the target title: speak in terms an experienced [targetTitle] would recognize as high-caliber work.
`.trim();
    const userPrompt = `
ORIGINAL BULLET:
${bullet}

CONTEXT:
- Company: ${company}
- Title: ${jobTitle}
- Skills: ${skills?.join(', ') || 'N/A'}

TARGET ROLE:
- Title: ${targetTitle || 'N/A'}
- Company: ${targetCompany || 'N/A'}
- Requirements: ${requirements?.join('; ') || 'N/A'}

ASSIGNED KEYWORDS:
${keywords.join(', ')}

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
    const diffs = dmp.diff_main(bullet, rewritten);
    dmp.diff_cleanupSemantic(diffs);
    const diffHtml = dmp.diff_prettyHtml(diffs);
    const keywordsUsed = keywords.filter(k =>
      rewritten.toLowerCase().includes(k.toLowerCase())
    );
    const result: RewriteBulletResponse = {
      rewrittenBullet: rewritten,
      keywordsUsed,
    };
    return res.status(200).json({ ...result, diff: diffHtml, originalBullet: bullet });
  } catch (error) {
    console.error('Error in rewrite-bullet API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}