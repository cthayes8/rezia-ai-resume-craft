import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';
import { AnalyzerService } from '@/lib/services/analyzer.service';
import { ParserService } from '@/lib/services/parser.service';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { jobDescription } = body;

    if (!jobDescription) {
      return NextResponse.json(
        { error: 'Job description is required' },
        { status: 400 }
      );
    }

    // Verify resume ownership
    const resume = await prisma.unifiedResume.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    const startTime = Date.now();

    // Convert unified resume to text for analysis
    const resumeText = generateResumeText(resume.builderData);
    
    // Create mock parsed document for analyzer
    const parsedResume = {
      id: resume.id,
      fileName: `${resume.title}.txt`,
      rawText: resumeText,
      parsedSections: extractSectionsFromBuilderData(resume.builderData),
      metadata: {
        parseDate: new Date(),
        wordCount: resumeText.split(/\s+/).length,
        format: 'txt' as const,
        confidence: 95
      }
    };

    // Perform analysis
    const analyzerService = new AnalyzerService();
    const analysisResult = await analyzerService.analyzeResumeMatch(
      parsedResume,
      jobDescription
    );

    const processingTime = Date.now() - startTime;

    // Save analysis to database
    const savedAnalysis = await prisma.resumeAnalysis.create({
      data: {
        resumeId: resume.id,
        jobDescription,
        overallScore: analysisResult.overallScore,
        keywordMatches: analysisResult.keywordMatches,
        similarityScore: analysisResult.similarityScore,
        atsCompatibility: analysisResult.atsCompatibility,
        sectionScores: analysisResult.sectionScores,
        recommendations: analysisResult.recommendations,
        insights: analysisResult.insights,
        processingTime
      }
    });

    // Update resume analyzed timestamp
    await prisma.unifiedResume.update({
      where: { id: resume.id },
      data: { analyzedAt: new Date() }
    });

    return NextResponse.json({
      success: true,
      data: {
        analysisId: savedAnalysis.id,
        analysis: analysisResult,
        processingTime
      }
    });

  } catch (error) {
    console.error('Error analyzing resume:', error);
    return NextResponse.json(
      { error: 'Analysis failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Helper function to generate resume text from builder data
function generateResumeText(builderData: any): string {
  const sections = builderData.sections || {};
  let text = '';

  // Contact info
  if (sections.basics) {
    text += `${sections.basics.name || ''}\n`;
    text += `${sections.basics.email || ''}\n`;
    text += `${sections.basics.phone || ''}\n`;
    text += `${sections.basics.location || ''}\n\n`;
  }

  // Summary
  if (sections.summary) {
    text += 'PROFESSIONAL SUMMARY\n';
    text += `${sections.summary}\n\n`;
  }

  // Experience
  if (sections.experience && sections.experience.length > 0) {
    text += 'WORK EXPERIENCE\n';
    sections.experience.forEach((exp: any) => {
      text += `${exp.position || ''} at ${exp.company || ''}\n`;
      text += `${exp.startDate || ''} - ${exp.endDate || 'Present'}\n`;
      if (exp.summary) {
        text += `${exp.summary}\n`;
      }
      if (exp.highlights && exp.highlights.length > 0) {
        exp.highlights.forEach((highlight: string) => {
          text += `• ${highlight}\n`;
        });
      }
      text += '\n';
    });
  }

  // Education
  if (sections.education && sections.education.length > 0) {
    text += 'EDUCATION\n';
    sections.education.forEach((edu: any) => {
      text += `${edu.degree || ''} in ${edu.area || ''}\n`;
      text += `${edu.institution || ''}\n`;
      text += `${edu.startDate || ''} - ${edu.endDate || ''}\n\n`;
    });
  }

  // Skills
  if (sections.skills && sections.skills.length > 0) {
    text += 'SKILLS\n';
    sections.skills.forEach((skillGroup: any) => {
      if (skillGroup.keywords && skillGroup.keywords.length > 0) {
        text += `${skillGroup.name || 'Skills'}: ${skillGroup.keywords.join(', ')}\n`;
      }
    });
    text += '\n';
  }

  // Projects
  if (sections.projects && sections.projects.length > 0) {
    text += 'PROJECTS\n';
    sections.projects.forEach((project: any) => {
      text += `${project.name || ''}\n`;
      if (project.description) {
        text += `${project.description}\n`;
      }
      if (project.highlights && project.highlights.length > 0) {
        project.highlights.forEach((highlight: string) => {
          text += `• ${highlight}\n`;
        });
      }
      text += '\n';
    });
  }

  return text;
}

// Helper function to extract sections from builder data
function extractSectionsFromBuilderData(builderData: any) {
  const sections = builderData.sections || {};

  return {
    contact: {
      name: sections.basics?.name || '',
      email: sections.basics?.email || '',
      phone: sections.basics?.phone || '',
      location: sections.basics?.location || '',
      linkedIn: sections.basics?.url || undefined,
      website: sections.basics?.website || undefined
    },
    summary: sections.summary || '',
    experience: (sections.experience || []).map((exp: any) => ({
      company: exp.company || '',
      position: exp.position || '',
      duration: `${exp.startDate || ''} - ${exp.endDate || 'Present'}`,
      location: exp.location || '',
      description: exp.summary || '',
      highlights: exp.highlights || []
    })),
    education: (sections.education || []).map((edu: any) => ({
      institution: edu.institution || '',
      degree: edu.degree || '',
      field: edu.area || '',
      duration: `${edu.startDate || ''} - ${edu.endDate || ''}`,
      gpa: edu.gpa || undefined,
      location: edu.location || undefined
    })),
    skills: (sections.skills || []).flatMap((skillGroup: any) => 
      skillGroup.keywords || []
    ),
    keywords: []
  };
}