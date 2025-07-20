import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { Document as PDFDocument } from '@react-pdf/renderer';

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
    const { format = 'pdf', includeAnalysis = false } = body;

    // Verify resume ownership
    const resume = await prisma.unifiedResume.findFirst({
      where: {
        id,
        userId
      },
      include: {
        analyses: includeAnalysis ? {
          take: 1,
          orderBy: { createdAt: 'desc' }
        } : undefined
      }
    });

    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    let exportData: any;
    let mimeType: string;
    let filename: string;

    switch (format) {
      case 'pdf':
        exportData = await generatePDF(resume);
        mimeType = 'application/pdf';
        filename = `${resume.title}.pdf`;
        break;

      case 'docx':
        exportData = await generateDOCX(resume);
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        filename = `${resume.title}.docx`;
        break;

      case 'html':
        exportData = generateHTML(resume);
        mimeType = 'text/html';
        filename = `${resume.title}.html`;
        break;

      case 'json':
        exportData = JSON.stringify(resume, null, 2);
        mimeType = 'application/json';
        filename = `${resume.title}.json`;
        break;

      case 'txt':
        exportData = generatePlainText(resume);
        mimeType = 'text/plain';
        filename = `${resume.title}.txt`;
        break;

      default:
        return NextResponse.json(
          { error: 'Unsupported format' },
          { status: 400 }
        );
    }

    const buffer = format === 'docx' ? Buffer.from(exportData) : 
                   format === 'pdf' ? exportData :
                   Buffer.from(exportData);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString()
      }
    });

  } catch (error) {
    console.error('Error exporting resume:', error);
    return NextResponse.json(
      { error: 'Export failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function generatePDF(resume: any): Promise<Buffer> {
  // For now, return HTML converted to PDF
  // In production, you'd use a proper PDF generation library
  const html = generateHTML(resume);
  return Buffer.from(html);
}

async function generateDOCX(resume: any): Promise<Buffer> {
  const sections = resume.builderData.sections || {};
  const basics = sections.basics || {};
  
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Header with name
        new Paragraph({
          children: [
            new TextRun({
              text: `${basics.firstName || ''} ${basics.lastName || ''}`.trim() || 'Resume',
              bold: true,
              size: 32
            })
          ],
          heading: HeadingLevel.TITLE
        }),

        // Headline
        ...(basics.headline ? [
          new Paragraph({
            children: [
              new TextRun({ text: basics.headline, italics: true, size: 24 })
            ]
          })
        ] : []),

        // Contact Info
        new Paragraph({
          children: [
            new TextRun(`${basics.email || ''} | ${basics.phone || ''} | ${basics.location?.city || ''} ${basics.location?.region || ''}`.replace(/\|\s*\|/g, '|').replace(/^\||\|$/g, '').trim())
          ]
        }),

        new Paragraph({ text: '' }), // Empty line

        // Summary
        ...(sections.summary?.content ? [
          new Paragraph({
            children: [new TextRun({ text: 'PROFESSIONAL SUMMARY', bold: true })],
            heading: HeadingLevel.HEADING_2
          }),
          new Paragraph({ text: sections.summary.content }),
          new Paragraph({ text: '' })
        ] : []),

        // Experience
        ...(sections.experience && sections.experience.length > 0 ? [
          new Paragraph({
            children: [new TextRun({ text: 'WORK EXPERIENCE', bold: true })],
            heading: HeadingLevel.HEADING_2
          }),
          ...sections.experience.flatMap((exp: any) => [
            new Paragraph({
              children: [
                new TextRun({ text: `${exp.position || ''} - ${exp.company || ''}`, bold: true })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `${exp.startDate || ''} - ${exp.current ? 'Present' : exp.endDate || ''}`, italics: true })
              ]
            }),
            ...(exp.location ? [new Paragraph({ text: exp.location })] : []),
            ...(exp.summary ? [new Paragraph({ text: exp.summary })] : []),
            ...(exp.highlights || []).map((highlight: string) => 
              new Paragraph({ text: `• ${highlight}` })
            ),
            new Paragraph({ text: '' })
          ])
        ] : []),

        // Education
        ...(sections.education && sections.education.length > 0 ? [
          new Paragraph({
            children: [new TextRun({ text: 'EDUCATION', bold: true })],
            heading: HeadingLevel.HEADING_2
          }),
          ...sections.education.flatMap((edu: any) => [
            new Paragraph({
              children: [
                new TextRun({ text: `${edu.degree || ''} in ${edu.field || ''}`, bold: true })
              ]
            }),
            new Paragraph({ text: `${edu.institution || ''} (${edu.startDate || ''} - ${edu.endDate || ''})` }),
            ...(edu.gpa ? [new Paragraph({ text: `GPA: ${edu.gpa}` })] : []),
            new Paragraph({ text: '' })
          ])
        ] : []),

        // Skills
        ...(sections.skills && sections.skills.length > 0 ? [
          new Paragraph({
            children: [new TextRun({ text: 'SKILLS', bold: true })],
            heading: HeadingLevel.HEADING_2
          }),
          ...sections.skills.map((skillGroup: any) => 
            new Paragraph({ 
              text: `${skillGroup.name || 'Skills'}: ${(skillGroup.skills || skillGroup.items || []).map((skill: any) => typeof skill === 'string' ? skill : skill.name).join(', ')}` 
            })
          ),
          new Paragraph({ text: '' })
        ] : []),

        // Projects
        ...(sections.projects && sections.projects.length > 0 ? [
          new Paragraph({
            children: [new TextRun({ text: 'PROJECTS', bold: true })],
            heading: HeadingLevel.HEADING_2
          }),
          ...sections.projects.flatMap((project: any) => [
            new Paragraph({
              children: [
                new TextRun({ text: project.name || '', bold: true })
              ]
            }),
            ...(project.description ? [new Paragraph({ text: project.description })] : []),
            ...(project.technologies && project.technologies.length > 0 ? [
              new Paragraph({ text: `Technologies: ${project.technologies.join(', ')}` })
            ] : []),
            ...(project.highlights || []).map((highlight: string) => 
              new Paragraph({ text: `• ${highlight}` })
            ),
            new Paragraph({ text: '' })
          ])
        ] : []),

        // Custom Sections
        ...(sections.custom && sections.custom.length > 0 ? 
          sections.custom.flatMap((customSection: any) => [
            new Paragraph({
              children: [new TextRun({ text: customSection.title?.toUpperCase() || 'CUSTOM SECTION', bold: true })],
              heading: HeadingLevel.HEADING_2
            }),
            ...(customSection.content ? [new Paragraph({ text: customSection.content })] : []),
            ...(customSection.items || []).map((item: string) => 
              new Paragraph({ text: `• ${item}` })
            ),
            new Paragraph({ text: '' })
          ])
        : [])
      ]
    }]
  });

  return await Packer.toBuffer(doc);
}

function generateHTML(resume: any): string {
  const sections = resume.builderData.sections || {};
  const basics = sections.basics || {};
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${basics.firstName || ''} ${basics.lastName || ''} - Resume</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .name { font-size: 2.5em; font-weight: bold; margin-bottom: 10px; }
        .headline { font-size: 1.3em; color: #666; font-style: italic; margin-bottom: 10px; }
        .contact { font-size: 1.1em; color: #666; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 1.4em; font-weight: bold; margin-bottom: 15px; text-transform: uppercase; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
        .job { margin-bottom: 20px; }
        .job-title { font-weight: bold; font-size: 1.1em; }
        .job-details { color: #666; font-style: italic; margin-bottom: 5px; }
        .highlights { margin-left: 20px; }
        .highlights li { margin-bottom: 3px; }
        .education-item { margin-bottom: 15px; }
        .skills-category { margin-bottom: 10px; }
        .project { margin-bottom: 20px; }
        .project-title { font-weight: bold; font-size: 1.1em; }
        .custom-section { margin-bottom: 30px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="name">${basics.firstName || ''} ${basics.lastName || ''}</div>
        ${basics.headline ? `<div class="headline">${basics.headline}</div>` : ''}
        <div class="contact">
            ${basics.email || ''} • ${basics.phone || ''} • ${basics.location?.city || ''} ${basics.location?.region || ''}
        </div>
    </div>

    ${sections.summary?.content ? `
    <div class="section">
        <div class="section-title">Professional Summary</div>
        <p>${sections.summary.content}</p>
    </div>
    ` : ''}

    ${sections.experience && sections.experience.length > 0 ? `
    <div class="section">
        <div class="section-title">Work Experience</div>
        ${sections.experience.map((exp: any) => `
            <div class="job">
                <div class="job-title">${exp.position || ''} - ${exp.company || ''}</div>
                <div class="job-details">${exp.startDate || ''} - ${exp.current ? 'Present' : exp.endDate || ''}</div>
                ${exp.location ? `<div class="job-details">${exp.location}</div>` : ''}
                ${exp.summary ? `<p>${exp.summary}</p>` : ''}
                ${exp.highlights && exp.highlights.length > 0 ? `
                <ul class="highlights">
                    ${exp.highlights.map((highlight: string) => `<li>${highlight}</li>`).join('')}
                </ul>
                ` : ''}
            </div>
        `).join('')}
    </div>
    ` : ''}

    ${sections.education && sections.education.length > 0 ? `
    <div class="section">
        <div class="section-title">Education</div>
        ${sections.education.map((edu: any) => `
            <div class="education-item">
                <div class="job-title">${edu.degree || ''} in ${edu.field || ''}</div>
                <div class="job-details">${edu.institution || ''} (${edu.startDate || ''} - ${edu.endDate || ''})</div>
                ${edu.gpa ? `<div class="job-details">GPA: ${edu.gpa}</div>` : ''}
            </div>
        `).join('')}
    </div>
    ` : ''}

    ${sections.skills && sections.skills.length > 0 ? `
    <div class="section">
        <div class="section-title">Skills</div>
        ${sections.skills.map((skillGroup: any) => `
            <div class="skills-category">
                <strong>${skillGroup.name || 'Skills'}:</strong> ${(skillGroup.skills || skillGroup.items || []).map((skill: any) => typeof skill === 'string' ? skill : skill.name).join(', ')}
            </div>
        `).join('')}
    </div>
    ` : ''}

    ${sections.projects && sections.projects.length > 0 ? `
    <div class="section">
        <div class="section-title">Projects</div>
        ${sections.projects.map((project: any) => `
            <div class="project">
                <div class="project-title">${project.name || ''}</div>
                ${project.description ? `<p>${project.description}</p>` : ''}
                ${project.technologies && project.technologies.length > 0 ? `
                    <div class="job-details">Technologies: ${project.technologies.join(', ')}</div>
                ` : ''}
                ${project.highlights && project.highlights.length > 0 ? `
                <ul class="highlights">
                    ${project.highlights.map((highlight: string) => `<li>${highlight}</li>`).join('')}
                </ul>
                ` : ''}
            </div>
        `).join('')}
    </div>
    ` : ''}

    ${sections.custom && sections.custom.length > 0 ? 
      sections.custom.map((customSection: any) => `
        <div class="custom-section">
            <div class="section-title">${customSection.title || 'Custom Section'}</div>
            ${customSection.content ? `<p>${customSection.content}</p>` : ''}
            ${customSection.items && customSection.items.length > 0 ? `
            <ul class="highlights">
                ${customSection.items.map((item: string) => `<li>${item}</li>`).join('')}
            </ul>
            ` : ''}
        </div>
      `).join('')
    : ''}
</body>
</html>`;
}

function generatePlainText(resume: any): string {
  const sections = resume.builderData.sections || {};
  const basics = sections.basics || {};
  let text = '';

  // Header
  text += `${basics.firstName || ''} ${basics.lastName || ''}\n`;
  if (basics.headline) {
    text += `${basics.headline}\n`;
  }
  text += `${basics.email || ''} | ${basics.phone || ''} | ${basics.location?.city || ''} ${basics.location?.region || ''}\n\n`;

  // Summary
  if (sections.summary?.content) {
    text += 'PROFESSIONAL SUMMARY\n';
    text += '='.repeat(50) + '\n';
    text += `${sections.summary.content}\n\n`;
  }

  // Experience
  if (sections.experience && sections.experience.length > 0) {
    text += 'WORK EXPERIENCE\n';
    text += '='.repeat(50) + '\n';
    sections.experience.forEach((exp: any) => {
      text += `${exp.position || ''} - ${exp.company || ''}\n`;
      text += `${exp.startDate || ''} - ${exp.current ? 'Present' : exp.endDate || ''}\n`;
      if (exp.location) {
        text += `${exp.location}\n`;
      }
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
    text += '='.repeat(50) + '\n';
    sections.education.forEach((edu: any) => {
      text += `${edu.degree || ''} in ${edu.field || ''}\n`;
      text += `${edu.institution || ''} (${edu.startDate || ''} - ${edu.endDate || ''})\n`;
      if (edu.gpa) {
        text += `GPA: ${edu.gpa}\n`;
      }
      text += '\n';
    });
  }

  // Skills
  if (sections.skills && sections.skills.length > 0) {
    text += 'SKILLS\n';
    text += '='.repeat(50) + '\n';
    sections.skills.forEach((skillGroup: any) => {
      text += `${skillGroup.name || 'Skills'}: ${(skillGroup.skills || skillGroup.items || []).map((skill: any) => typeof skill === 'string' ? skill : skill.name).join(', ')}\n`;
    });
    text += '\n';
  }

  // Projects
  if (sections.projects && sections.projects.length > 0) {
    text += 'PROJECTS\n';
    text += '='.repeat(50) + '\n';
    sections.projects.forEach((project: any) => {
      text += `${project.name || ''}\n`;
      if (project.description) {
        text += `${project.description}\n`;
      }
      if (project.technologies && project.technologies.length > 0) {
        text += `Technologies: ${project.technologies.join(', ')}\n`;
      }
      if (project.highlights && project.highlights.length > 0) {
        project.highlights.forEach((highlight: string) => {
          text += `• ${highlight}\n`;
        });
      }
      text += '\n';
    });
  }

  // Custom Sections
  if (sections.custom && sections.custom.length > 0) {
    sections.custom.forEach((customSection: any) => {
      text += `${customSection.title?.toUpperCase() || 'CUSTOM SECTION'}\n`;
      text += '='.repeat(50) + '\n';
      if (customSection.content) {
        text += `${customSection.content}\n`;
      }
      if (customSection.items && customSection.items.length > 0) {
        customSection.items.forEach((item: string) => {
          text += `• ${item}\n`;
        });
      }
      text += '\n';
    });
  }

  return text;
}