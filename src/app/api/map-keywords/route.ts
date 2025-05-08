import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ResumeData } from '@/types/resume';

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * API Route: Map keywords to the most relevant resume bullets.
 * Output: [{ workIndex: number, bulletIndex: number, assignedKeywords: string[] }]
 */
export async function POST(req: Request) {
  const { resumeData, keywords } = await req.json() as { resumeData?: ResumeData; keywords?: string[] };
  
  if (!resumeData || !Array.isArray(keywords)) {
    return NextResponse.json(
      { error: 'Missing resumeData or keywords' },
      { status: 400 }
    );
  }

  try {
    const systemPrompt = `
You are a resume keyword mapping assistant.

Your task is to assign the most relevant keywords to each resume bullet based on content overlap, relevance, and intent.

Rules:
- Only assign keywords to work experience bullets (not summary, education, or skills).
- A keyword may appear in **no more than 3 bullets** total.
- A bullet may have **multiple relevant keywords** assigned.
- Only include bullets that have at least one keyword assigned.
- Do NOT include full bullet text—just indexes.

Output ONLY valid minified JSON as:
[
  {
    "workIndex": number,          // index of the job in resumeData.work[]
    "bulletIndex": number,        // index of the bullet in work[workIndex].bullets[]
    "assignedKeywords": [string]  // assigned relevant keywords
  }
]
`.trim();

    const userPrompt = `
Resume JSON (work section only):
${JSON.stringify(resumeData.work)}

Keywords to assign:
${JSON.stringify(keywords)}
`.trim();

    const completion = await openai.chat.completions.create({
      model: 'o3-mini-2025-01-31',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
    });

    let content = completion.choices[0]?.message?.content || '';
    content = content.replace(/```json\s*|```/g, '').trim();

    let assignments;
    try {
      assignments = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse map-keywords JSON:', content);
      return NextResponse.json(
        { error: 'Invalid JSON from AI' },
        { status: 500 }
      );
    }

    if (!Array.isArray(assignments)) {
      return NextResponse.json(
        { error: 'Unexpected response format' },
        { status: 500 }
      );
    }

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error('Error in map-keywords API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
