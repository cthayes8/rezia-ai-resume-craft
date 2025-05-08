import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * API Route: Extract structured info from job description
 * Returns: { targetTitle, targetCompany, requirements, keywords }
 */
export async function POST(req: Request) {
  const { jobDescription } = await req.json();
  
  if (typeof jobDescription !== 'string') {
    return NextResponse.json(
      { error: 'Invalid jobDescription' },
      { status: 400 }
    );
  }

  try {
    const systemPrompt = `
You are a job description parsing assistant. Extract key information for tailoring a resume. Respond ONLY in valid, minified JSON—no comments, explanations, or markdown.

Required format:
{
  "targetTitle": string,        // Official job title
  "targetCompany": string,      // Company name (from context or domain if possible)
  "requirements": [string],     // Key qualifications or role responsibilities (short bullet-style phrases)
  "keywords": [string]          // 5–10 relevant technical skills, platforms, tools, or certifications (no soft skills)
}

Guidelines:
- "targetTitle": Use the job title listed in the heading or first paragraph.
- "targetCompany": Infer from the employer's name, domain, or description.
- "requirements": Extract key responsibilities or qualifications in short bullet-style phrases (1 per item, max 10).
- "keywords": Include only hard skills and domain-specific terms. Do NOT include soft skills like "team player" or "fast learner".
`.trim();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-2024-08-06',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: jobDescription }
      ],
    });

    let content = completion.choices[0]?.message?.content || '';
    content = content.replace(/```json\s*|```/g, '').trim();

    let data;
    try {
      data = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse JD info JSON:', content);
      return NextResponse.json(
        { error: 'Invalid JSON from AI' },
        { status: 500 }
      );
    }

    const { targetTitle, targetCompany, requirements, keywords } = data;
    if (
      typeof targetTitle !== 'string' ||
      typeof targetCompany !== 'string' ||
      !Array.isArray(requirements) ||
      !Array.isArray(keywords)
    ) {
      return NextResponse.json(
        { error: 'Unexpected response format' },
        { status: 500 }
      );
    }

    return NextResponse.json({ targetTitle, targetCompany, requirements, keywords });
  } catch (error) {
    console.error('Error in extract-jd-info API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
