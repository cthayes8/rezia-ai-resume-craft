import { NextResponse } from 'next/server';
// Use Node.js runtime to avoid bundling Chrome lambda source maps
export const runtime = 'nodejs';
import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { ResumeData } from '@/types/resume';

// Helper: render resume HTML with inline styles for PDF
function renderHtml(resume: ResumeData, templateId: number = 1): string {
  // Load shared CSS from public/templates.css
  const cssPath = path.join(process.cwd(), 'public', 'templates.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  const styles = `<style>${cssContent}</style>`;

  // Contact line
  const contactItems = [resume.contact.email, resume.contact.phone, resume.contact.link].filter(Boolean);
  // Build HTML sections
  const summaryHtml = `<section><h2>Summary</h2><p>${resume.summary}</p></section>`;
  const workHtml = resume.work.map(job => {
    const bullets = job.bullets.map(b => `<li>${b}</li>`).join('');
    return `
      <div>
        <h3>${job.title} @ ${job.company}` +
        ((job.from || job.to) ? ` (${job.from || ''}${job.from && job.to ? '–' : ''}${job.to || ''})` : '') +
        `</h3>
        <ul>${bullets}</ul>
      </div>`;
  }).join('');
  const educationHtml = resume.education.map(edu => {
    const dateStr = (edu.from || edu.to)
      ? ` (${edu.from || ''}${edu.from && edu.to ? '–' : ''}${edu.to || ''})`
      : '';
    return `<div><p>${edu.degree}, ${edu.institution}${dateStr}</p></div>`;
  }).join('');
  const skillsHtml = `<section><h2>Skills</h2><p>${resume.skills.join(', ')}</p></section>`;
  const awardsHtml = (resume.awards && resume.awards.length)
    ? `<section><h2>Awards</h2><ul>${resume.awards.map(a => `<li>${a}</li>`).join('')}</ul></section>`
    : '';
  const certHtml = (resume.certifications && resume.certifications.length)
    ? `<section><h2>Certifications</h2><ul>${resume.certifications.map(c => `<li>${c}</li>`).join('')}</ul></section>`
    : '';

  // Combine into full HTML
  return `<!DOCTYPE html>
<html class="template${templateId}"><head><meta charset="utf-8"/><title>Resume</title>${styles}</head>
<body>
  <div class="header">
    <div class="name">${resume.name}</div>
    <div class="contact">${contactItems.join(' • ')}</div>
  </div>
  ${summaryHtml}
  <section><h2>Work Experience</h2>${workHtml}</section>
  <section><h2>Education</h2>${educationHtml}</section>
  ${skillsHtml}
  ${awardsHtml}
  ${certHtml}
</body></html>`;
}

/**
 * API Route: generate a PDF from resume HTML via Puppeteer
 */
export async function POST(req: Request) {
  try {
    const { resumeData, templateId } = await req.json() as { resumeData?: ResumeData; templateId?: number };
    
    if (!resumeData) {
      return NextResponse.json(
        { error: 'Missing resumeData' },
        { status: 400 }
      );
    }

    // Launch headless browser: use chrome-aws-lambda on server, fallback to full puppeteer locally
    let browser;
    const executablePath = await chromium.executablePath;
    if (executablePath) {
      // Serverless / AWS Lambda: use chrome-aws-lambda binary
      browser = await puppeteer.launch({
        args: chromium.args,
        executablePath,
        headless: chromium.headless,
        defaultViewport: chromium.defaultViewport,
      });
    } else {
      // Local development: use full puppeteer (bundled Chromium)
      const pptr = await import('puppeteer');
      browser = await pptr.default.launch({ headless: true });
    }

    const page = await browser.newPage();
    // Set HTML content and emulate screen media
    const html = renderHtml(resumeData, templateId || 1);
    await page.setContent(html, { waitUntil: 'networkidle2' });
    await page.emulateMediaType('screen');

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'letter',
      printBackground: true,
    });

    await browser.close();

    // Return PDF with correct headers
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="resume.pdf"',
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}