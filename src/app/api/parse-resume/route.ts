import { NextRequest, NextResponse } from 'next/server';
import { MarkdownParserService } from '@/lib/services/markdown-parser.service';
import { EnhancedResumeParserService } from '@/lib/services/enhanced-resume-parser.service';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload PDF, Word, or text files.' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    let parsedDocument;
    
    try {
      // Try enhanced parser first (incorporates Resume-Matcher improvements)
      const enhancedParser = new EnhancedResumeParserService();
      const enhancedResult = await enhancedParser.parseResume(file);
      
      // Convert enhanced result to expected format for backward compatibility
      parsedDocument = {
        id: enhancedResult.id,
        fileName: enhancedResult.fileName,
        rawText: enhancedResult.rawContent,
        parsedSections: {
          contact: {
            name: enhancedResult.processedData.personalData.name,
            email: enhancedResult.processedData.personalData.email,
            phone: enhancedResult.processedData.personalData.phone,
            location: enhancedResult.processedData.personalData.location.city && enhancedResult.processedData.personalData.location.state 
              ? `${enhancedResult.processedData.personalData.location.city}, ${enhancedResult.processedData.personalData.location.state}`
              : '',
            linkedIn: enhancedResult.processedData.personalData.links.find(l => l.type === 'linkedin')?.url,
            website: enhancedResult.processedData.personalData.links.find(l => l.type === 'website')?.url
          },
          summary: enhancedResult.processedData.summary,
          experience: enhancedResult.processedData.experiences.map(exp => ({
            company: exp.company,
            position: exp.position,
            duration: exp.endDate ? `${exp.startDate} - ${exp.endDate}` : `${exp.startDate} - Present`,
            location: exp.location?.city && exp.location?.state 
              ? `${exp.location.city}, ${exp.location.state}` 
              : '',
            description: exp.description,
            highlights: exp.achievements
          })),
          education: enhancedResult.processedData.education.map(edu => ({
            institution: edu.institution,
            degree: edu.degree,
            field: edu.field,
            duration: edu.endDate ? `${edu.startDate} - ${edu.endDate}` : edu.startDate,
            gpa: edu.gpa,
            location: edu.location?.city && edu.location?.state 
              ? `${edu.location.city}, ${edu.location.state}` 
              : ''
          })),
          skills: [
            ...enhancedResult.processedData.skills.technical,
            ...enhancedResult.processedData.skills.tools,
            ...enhancedResult.processedData.skills.frameworks
          ],
          keywords: enhancedResult.processedData.extractedKeywords
        },
        metadata: enhancedResult.metadata
      };
    } catch (enhancedError) {
      console.warn('Enhanced parser failed, falling back to markdown parser:', enhancedError);
      
      try {
        // Fallback to markdown parser
        const markdownParser = new MarkdownParserService();
        parsedDocument = await markdownParser.parseResume(file);
      } catch (markdownError) {
        console.error('Both parsers failed:', markdownError);
        throw markdownError;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: parsedDocument.id,
        fileName: parsedDocument.fileName,
        parsedSections: parsedDocument.parsedSections,
        metadata: parsedDocument.metadata
      }
    });

  } catch (error) {
    console.error('Resume parsing error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to parse resume',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Resume Parser API - Upload a resume file for parsing',
    supportedFormats: ['PDF', 'DOCX', 'DOC', 'TXT'],
    maxFileSize: '10MB',
    usage: 'POST multipart/form-data with "file" field'
  });
}