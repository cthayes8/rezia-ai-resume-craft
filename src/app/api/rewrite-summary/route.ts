import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import DiffMatchPatch from 'diff-match-patch';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const dmp = new DiffMatchPatch();

/**
 * API Route: Rewrite the professional summary with full context.
 * Returns: { rewrittenSummary, keywordsUsed, diff }
 */
export async function POST(req: Request) {
  const {
    originalSummary,
    optimizedBullets,
    skills,
    targetTitle,
    targetCompany,
    requirements,
    keywords,
    jobDescription
  } = await req.json() as {
    originalSummary?: string;
    optimizedBullets?: string[];
    skills?: string[];
    targetTitle?: string;
    targetCompany?: string;
    requirements?: string[];
    keywords?: string[];
    jobDescription?: string;
  };

  // Basic input validation
  if (
    typeof originalSummary !== 'string' ||
    !Array.isArray(optimizedBullets) ||
    !Array.isArray(skills) ||
    typeof targetTitle !== 'string' ||
    typeof targetCompany !== 'string' ||
    !Array.isArray(requirements) ||
    !Array.isArray(keywords) ||
    typeof jobDescription !== 'string'
  ) {
    return NextResponse.json(
      { error: 'Invalid request payload' },
      { status: 400 }
    );
  }

  try {
    const systemPrompt = `
You are an elite resume editor rewriting a professional summary.

Your task is to optimize the summary to better align with a target role, using the revised work experience bullets and job description as context.

Guidelines:
- Use concise, third-person style (no "I", no first person)
- Start strong with the candidate's overall positioning
- Highlight areas of alignment with the target role, but don't mention the target role or company name
- Weave in keywords only where relevant
- Do NOT include a separate skills section
- Do NOT fabricate experience
- Return only the rewritten summary—no labels, no extra formatting
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

OPTIMIZED BULLETS:
${optimizedBullets.join('\n')}

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

    // Strip quotes if present
    if ((rewritten.startsWith('"') && rewritten.endsWith('"')) || (rewritten.startsWith("'") && rewritten.endsWith("'"))) {
      rewritten = rewritten.slice(1, -1).trim();
    }

    // Compute diff for UI diff viewer
    const diffs = dmp.diff_main(originalSummary, rewritten);
    dmp.diff_cleanupSemantic(diffs);
    const diffHtml = dmp.diff_prettyHtml(diffs);

    // Detect which keywords were used
    const keywordsUsed = keywords.filter(k =>
      rewritten.toLowerCase().includes(k.toLowerCase())
    );

    return NextResponse.json({
      originalSummary,
      rewrittenSummary: rewritten,
      keywordsUsed,
      diff: diffHtml
    });
  } catch (error) {
    console.error('Error in rewrite-summary API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
