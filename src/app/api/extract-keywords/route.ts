import { NextRequest, NextResponse } from 'next/server';
import { OpenAIService } from '@/lib/services/openai.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobDescription, text, type = 'job' } = body;

    if (!jobDescription && !text) {
      return NextResponse.json(
        { error: 'Job description or text is required' },
        { status: 400 }
      );
    }

    const openaiService = new OpenAIService();
    const inputText = jobDescription || text;

    if (type === 'job') {
      // Extract keywords from job description
      const keywords = await openaiService.extractJobKeywords(inputText);
      
      return NextResponse.json({
        success: true,
        data: {
          keywords: keywords.keywords,
          requirements: keywords.requirements,
          preferences: keywords.preferences,
          summary: {
            totalKeywords: keywords.keywords.length,
            hardSkills: keywords.keywords.filter(k => k.category === 'hard_skill').length,
            softSkills: keywords.keywords.filter(k => k.category === 'soft_skill').length,
            tools: keywords.keywords.filter(k => k.category === 'tool').length,
            certifications: keywords.keywords.filter(k => k.category === 'certification').length
          }
        }
      });
    } else {
      // Generate embedding for similarity analysis
      const embedding = await openaiService.generateEmbedding(inputText);
      
      return NextResponse.json({
        success: true,
        data: {
          embedding,
          textLength: inputText.length,
          wordCount: inputText.split(/\s+/).length
        }
      });
    }

  } catch (error) {
    console.error('Keyword extraction error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to extract keywords',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Keyword Extraction API',
    usage: {
      jobAnalysis: 'POST with { jobDescription: "text", type: "job" }',
      embedding: 'POST with { text: "content", type: "embedding" }'
    },
    features: [
      'Advanced keyword extraction with importance scoring',
      'Semantic embeddings for similarity matching',
      'Category classification (skills, tools, certifications)',
      'Requirement vs preference separation'
    ]
  });
}