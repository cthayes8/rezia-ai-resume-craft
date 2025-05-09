import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import DiffMatchPatch from 'diff-match-patch';
import type { RewriteSkillsResponse } from '@/types/resume';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const dmp = new DiffMatchPatch();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  const {
    originalSkills,
    optimizedSummary,
    optimizedBullets,
    keywords,
    targetTitle,
    targetCompany,
    requirements,
    jobDescription,
  } = req.body as {
    originalSkills?: string[];
    optimizedSummary?: string;
    optimizedBullets?: string[];
    keywords?: string[];
    targetTitle?: string;
    targetCompany?: string;
    requirements?: string[];
    jobDescription?: string;
  };
  if (
    !Array.isArray(originalSkills) ||
    typeof optimizedSummary !== 'string' ||
    !Array.isArray(optimizedBullets) ||
    !Array.isArray(keywords) ||
    typeof targetTitle !== 'string' ||
    typeof targetCompany !== 'string' ||
    !Array.isArray(requirements) ||
    typeof jobDescription !== 'string'
  ) {
    return res.status(400).json({ error: 'Invalid request payload' });
  }
  try {
    const systemPrompt = `
You are a professional resume editor tasked with rewriting the 'Skills' section of a resume.

Your job is to:
- Align the skills with the target job title and description
- Use concise, domain-specific terms only (no generic traits like "team player")
- Incorporate relevant keywords and remove outdated or irrelevant skills
- Avoid duplication
- Return a valid JSON array of short skill phrases (e.g., ["SQL", "Agile Project Management"])

Do NOT include explanations, quotes, or markdown formatting.
`.trim();
    const userPrompt = `
TARGET ROLE:
- Title: ${targetTitle}
- Company: ${targetCompany}
- Requirements: ${requirements.join('; ')}
- Keywords to consider: ${keywords.join(', ')}

RESUME CONTEXT:
- Summary: ${optimizedSummary}
- Optimized Bullets: ${optimizedBullets.join('\n')}
- Original Skills: ${originalSkills.join(', ')}

JOB DESCRIPTION:
${jobDescription}

Respond only with a JSON array of optimized skill strings.
`.trim();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini-2025-04-14',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });
    let content = completion.choices[0]?.message?.content?.trim() || '';
    content = content.replace(/```json\s*|```/g, '').trim();
    let rewrittenSkills: string[];
    try {
      rewrittenSkills = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse skills JSON:', content);
      return res.status(500).json({ error: 'Invalid JSON from AI' });
    }
    if (!Array.isArray(rewrittenSkills)) {
      return res.status(500).json({ error: 'Unexpected response format' });
    }
    const usedKeywords = keywords.filter(k =>
      rewrittenSkills.some(s => s.toLowerCase().includes(k.toLowerCase()))
    );
    const origText = originalSkills.join(', ');
    const newText = rewrittenSkills.join(', ');
    const diffs = dmp.diff_main(origText, newText);
    dmp.diff_cleanupSemantic(diffs);
    const diffHtml = dmp.diff_prettyHtml(diffs);
    const result: RewriteSkillsResponse = { rewrittenSkills };
    return res.status(200).json({ ...result, keywordsUsed: usedKeywords, diff: diffHtml, originalSkills });
  } catch (error) {
    console.error('Error in rewrite-skills API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}