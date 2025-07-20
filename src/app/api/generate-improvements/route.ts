import { NextRequest, NextResponse } from 'next/server';
import { OpenAIService } from '@/lib/services/openai.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      resumeText, 
      jobDescription, 
      missingKeywords = [], 
      section = null,
      improvementType = 'general'
    } = body;

    if (!resumeText || !jobDescription) {
      return NextResponse.json(
        { error: 'Resume text and job description are required' },
        { status: 400 }
      );
    }

    const openaiService = new OpenAIService();
    let improvements = [];

    switch (improvementType) {
      case 'general':
        improvements = await openaiService.suggestImprovements(
          resumeText,
          jobDescription,
          missingKeywords
        );
        break;

      case 'content':
        if (!section) {
          return NextResponse.json(
            { error: 'Section is required for content improvements' },
            { status: 400 }
          );
        }
        
        const enhancedContent = await openaiService.enhanceContent(
          resumeText,
          section,
          missingKeywords
        );
        
        improvements = [{
          section,
          type: 'modify',
          suggestion: enhancedContent,
          reasoning: `Enhanced ${section} content with better keyword integration and impact statements`,
          impact: 15,
          keywords: missingKeywords
        }];
        break;

      case 'bullets':
        const { role, company, responsibilities } = body;
        if (!role || !company || !responsibilities) {
          return NextResponse.json(
            { error: 'Role, company, and responsibilities are required for bullet generation' },
            { status: 400 }
          );
        }

        const bullets = await openaiService.generateBulletPoints(
          role,
          company,
          responsibilities,
          missingKeywords
        );

        improvements = [{
          section: 'experience',
          type: 'modify',
          suggestion: bullets.join('\n• '),
          reasoning: 'Generated impactful bullet points with quantified achievements',
          impact: 20,
          keywords: missingKeywords
        }];
        break;

      case 'ats':
        const atsAnalysis = await openaiService.analyzeATSCompatibility(resumeText);
        improvements = atsAnalysis.issues.map(issue => ({
          section: 'formatting',
          type: 'modify',
          suggestion: issue.suggestion,
          reasoning: issue.description,
          impact: Math.abs(issue.impact),
          keywords: []
        }));
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid improvement type' },
          { status: 400 }
        );
    }

    // Calculate potential score improvement
    const totalImpact = improvements.reduce((sum, imp) => sum + (imp.impact || 0), 0);
    
    return NextResponse.json({
      success: true,
      data: {
        improvements,
        summary: {
          totalSuggestions: improvements.length,
          potentialImpact: Math.min(totalImpact, 50), // Cap at 50 points
          categories: [...new Set(improvements.map(imp => imp.section))],
          keywordsAddressed: missingKeywords.length
        }
      }
    });

  } catch (error) {
    console.error('Improvement generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate improvements',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'AI Improvement Generation API',
    types: {
      general: 'Overall resume improvements',
      content: 'Section-specific content enhancement',
      bullets: 'Achievement bullet point generation',
      ats: 'ATS compatibility improvements'
    },
    usage: {
      general: 'POST with { resumeText, jobDescription, missingKeywords, improvementType: "general" }',
      content: 'POST with { resumeText, jobDescription, section, missingKeywords, improvementType: "content" }',
      bullets: 'POST with { role, company, responsibilities, missingKeywords, improvementType: "bullets" }',
      ats: 'POST with { resumeText, improvementType: "ats" }'
    }
  });
}