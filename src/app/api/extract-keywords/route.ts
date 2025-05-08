import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * API Route: Extract key skills/keywords from a job description
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
    const systemPrompt = `Extract the 5 to 10 most important skills or keywords from a job description. Respond with valid JSON only: { "keywords": [string] }.`;
    const userPrompt = jobDescription;
    const completion = await openai.chat.completions.create({
      model: 'o3-mini-2025-01-31',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
    });

    let content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content returned from AI');
    }

    // Strip code fences
    content = content.replace(/```json\s*|```/g, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse keywords JSON:', content);
      return NextResponse.json(
        { error: 'Failed to parse AI output as JSON' },
        { status: 500 }
      );
    }

    if (!Array.isArray(parsed.keywords)) {
      return NextResponse.json(
        { error: 'Unexpected response format' },
        { status: 500 }
      );
    }

    return NextResponse.json({ keywords: parsed.keywords });
  } catch (error) {
    console.error('Error in extract-keywords API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}