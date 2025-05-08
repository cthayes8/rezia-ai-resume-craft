import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import DiffMatchPatch from 'diff-match-patch';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const dmp = new DiffMatchPatch();

/**
 * API Route: Rewrite the skills section with full context.
 * Returns: rewrittenSkills[], keywordsUsed[], diffHtml
 */
export async function POST(req: Request) {
  const {
    originalSkills,
    optimizedSummary,
    optimizedBullets,
    keywords,
    targetTitle,
    targetCompany,
    requirements,
    jobDescription
  } = await req.json() as {
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
    return NextResponse.json(
      { error: 'Invalid request payload' },
      { status: 400 }
    );
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
      model: 'o3-mini-2025-01-31',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
    });

    let content = completion.choices[0]?.message?.content?.trim() || '';
    content = content.replace(/```json\s*|```/g, '').trim();

    let rewrittenSkills: string[];
    try {
      rewrittenSkills = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse skills JSON:', content);
      return NextResponse.json(
        { error: 'Invalid JSON from AI' },
        { status: 500 }
      );
    }

    if (!Array.isArray(rewrittenSkills)) {
      return NextResponse.json(
        { error: 'Unexpected response format' },
        { status: 500 }
      );
    }

    const usedKeywords = keywords.filter(k =>
      rewrittenSkills.some(s => s.toLowerCase().includes(k.toLowerCase()))
    );

    const origText = originalSkills.join(', ');
    const newText = rewrittenSkills.join(', ');
    const diffs = dmp.diff_main(origText, newText);
    dmp.diff_cleanupSemantic(diffs);
    const diffHtml = dmp.diff_prettyHtml(diffs);

    return NextResponse.json({
      originalSkills,
      rewrittenSkills,
      keywordsUsed: usedKeywords,
      diff: diffHtml
    });
  } catch (error) {
    console.error('Error in rewrite-skills API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
