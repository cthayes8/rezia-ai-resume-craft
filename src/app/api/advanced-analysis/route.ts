import { NextRequest, NextResponse } from 'next/server';
import { AnalyzerService } from '@/lib/services/analyzer.service';
import { ParserService } from '@/lib/services/parser.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resumeFile, jobDescription, resumeText } = body;

    if (!jobDescription) {
      return NextResponse.json(
        { error: 'Job description is required' },
        { status: 400 }
      );
    }

    if (!resumeFile && !resumeText) {
      return NextResponse.json(
        { error: 'Resume file or text is required' },
        { status: 400 }
      );
    }

    const parserService = new ParserService();
    const analyzerService = new AnalyzerService();

    let parsedResume;

    if (resumeFile) {
      // Handle file upload
      const buffer = Buffer.from(resumeFile.data, 'base64');
      const file = new File([buffer], resumeFile.name, { type: resumeFile.type });
      parsedResume = await parserService.parseResume(file);
    } else {
      // Handle direct text input
      parsedResume = {
        id: crypto.randomUUID(),
        fileName: 'resume.txt',
        rawText: resumeText,
        parsedSections: await parserService.parseJobDescription(resumeText),
        metadata: {
          parseDate: new Date(),
          wordCount: resumeText.split(/\s+/).length,
          format: 'txt' as const,
          confidence: 85
        }
      };
    }

    // Perform comprehensive analysis
    const analysis = await analyzerService.analyzeResumeMatch(parsedResume, jobDescription);

    return NextResponse.json({
      success: true,
      data: {
        resumeId: parsedResume.id,
        fileName: parsedResume.fileName,
        analysis,
        parsedSections: parsedResume.parsedSections,
        metadata: parsedResume.metadata
      }
    });

  } catch (error) {
    console.error('Advanced analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Advanced Analysis API - Use POST to analyze resume against job description',
    endpoints: {
      analyze: 'POST /api/advanced-analysis',
      parse: 'POST /api/parse-resume',
      keywords: 'POST /api/extract-keywords'
    }
  });
}