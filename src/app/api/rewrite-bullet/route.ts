import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import DiffMatchPatch from 'diff-match-patch';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const dmp = new DiffMatchPatch();

/**
 * API Route: Rewrite a single resume bullet with context.
 * Returns rewritten bullet + keyword usage + diff metadata.
 */
export async function POST(req: Request) {
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
    usedVerbs
  } = await req.json();

  // Prepare list of verbs to avoid repeating
  const avoidVerbs: string[] = Array.isArray(usedVerbs) ? usedVerbs : [];

  if (
    typeof bullet !== 'string' ||
    !Array.isArray(keywords) ||
    typeof jobTitle !== 'string' ||
    typeof company !== 'string' ||
    typeof jobDescription !== 'string'
  ) {
    return NextResponse.json(
      { error: 'Invalid request payload' },
      { status: 400 }
    );
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
- Naturally integrate the provided keywords **only if relevant to the bullet's meaning**.
- Consider the job requirements when rewriting to best tailor language to the role.
- Never force keywords or make up responsibilities.
- Preserve the original intent and scope of the bullet.
- Respond ONLY with the rewritten bullet—no quotes, labels, or extra text.
`.trim();

    const userPrompt = `
ORIGINAL BULLET:
${bullet}

CONTEXT:
- Company: ${company}
- Title: ${jobTitle}
- Skills: ${skills?.join(', ') || 'N/A'}

TARGET ROLE:
- Title: ${targetTitle}
- Company: ${targetCompany}
- Requirements: ${requirements.join('; ')}

ASSIGNED KEYWORDS:
${keywords.join(', ')}

FULL JOB DESCRIPTION:
${jobDescription}
`.trim();

    const completion = await openai.chat.completions.create({
      model: 'o3-mini-2025-01-31',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
    });

    let rewritten = completion.choices[0]?.message?.content?.trim() || '';

    // Remove wrapping quotes if any
    if (
      (rewritten.startsWith('"') && rewritten.endsWith('"')) ||
      (rewritten.startsWith("'") && rewritten.endsWith("'"))
    ) {
      rewritten = rewritten.slice(1, -1).trim();
    }

    // Create diff metadata
    const diffs = dmp.diff_main(bullet, rewritten);
    dmp.diff_cleanupSemantic(diffs);
    const diffHtml = dmp.diff_prettyHtml(diffs);

    // Determine which keywords were actually used
    const keywordsUsed = keywords.filter(k =>
      rewritten.toLowerCase().includes(k.toLowerCase())
    );

    return NextResponse.json({
      originalBullet: bullet,
      rewrittenBullet: rewritten,
      keywordsUsed,
      diff: diffHtml
    });
  } catch (error) {
    console.error('Error in rewrite-bullet API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
