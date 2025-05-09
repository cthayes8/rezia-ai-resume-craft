import type { NextApiRequest, NextApiResponse } from 'next';
import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import type { ResumeData } from '@/types/resume';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  try {
    const contentType = req.headers['content-type'] || '';
    let resumeData: ResumeData;
    let templateId: number;
    if (contentType.includes('application/json')) {
      resumeData = req.body.resumeData;
      templateId = req.body.templateId || 1;
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const params = new URLSearchParams(req.body as any);
      const jsonData = params.get('resumeData') || '';
      resumeData = jsonData ? JSON.parse(jsonData) : ({} as ResumeData);
      templateId = Number(params.get('templateId') || '1');
    } else {
      resumeData = req.body.resumeData;
      templateId = req.body.templateId || 1;
    }
    if (!resumeData) {
      return res.status(400).json({ error: 'Missing resumeData' });
    }
    function renderHtml(resume: ResumeData, templateId: number = 1): string {
      let styles = '';
      try {
        const cssPath = path.join(process.cwd(), 'public', 'templates.css');
        const cssContent = fs.readFileSync(cssPath, 'utf8');
        styles = `<style>${cssContent}</style>`;
      } catch {
        console.warn('templates.css not found, skipping CSS injection');
      }
      // Summary section
      const summaryHtml = `<section><h2>Summary</h2><p>${resume.summary}</p></section>`;
      // Work section with structured job entries
      const workHtml = resume.work.map(job => {
        const bullets = job.bullets.map(b => `<li>${b}</li>`).join('');
        const dates = (job.from || job.to)
          ? ` (${job.from || ''}${job.from && job.to ? '–' : ''}${job.to || ''})`
          : '';
        const metaHtml = `<div class="job-meta"><strong>${job.company}</strong><span>${job.title}${dates}</span></div>`;
        return `<div class="job-entry">${metaHtml}<ul>${bullets}</ul></div>`;
      }).join('');
      const educationHtml = resume.education.map(edu => {
        const dateStr = (edu.from || edu.to) ? ` (${edu.from || ''}${edu.from && edu.to ? '–' : ''}${edu.to || ''})` : '';
        return `<div><p>${edu.degree}, ${edu.institution}${dateStr}</p></div>`;
      }).join('');
      const skillsHtml = `<section><h2>Skills</h2><p>${resume.skills.join(', ')}</p></section>`;
      const awardsHtml = resume.awards && resume.awards.length
        ? `<section><h2>Awards</h2><ul>${resume.awards.map(a => `<li>${a}</li>`).join('')}</ul></section>`
        : '';
      const certHtml = resume.certifications && resume.certifications.length
        ? `<section><h2>Certifications</h2><ul>${resume.certifications.map(c => `<li>${c}</li>`).join('')}</ul></section>`
        : '';
      return `<!DOCTYPE html>
<html class="template${templateId}"><head><meta charset="utf-8"/><title>Resume</title>${styles}</head>
<body>
  <div class="header" style="display:flex;justify-content:space-between;align-items:center;">
    <div class="name">${resume.name}</div>
    <div class="contact">
      <div>${resume.contact.email || ''}</div>
      ${resume.contact.phone ? `<div>${resume.contact.phone}</div>` : ''}
      ${resume.contact.link ? `<div>${resume.contact.link}</div>` : ''}
    </div>
  </div>
  ${summaryHtml}
  <section><h2>Work Experience</h2>${workHtml}</section>
  <section><h2>Education</h2>${educationHtml}</section>
  ${skillsHtml}
  ${awardsHtml}
  ${certHtml}
</body></html>`;
    }
    let browser;
    const executablePath = await chromium.executablePath;
    if (executablePath) {
      browser = await puppeteer.launch({
        args: chromium.args,
        executablePath,
        headless: chromium.headless,
        defaultViewport: chromium.defaultViewport,
      });
    } else {
      const pptr = await import('puppeteer');
      browser = await pptr.default.launch({ headless: true });
    }
    const page = await browser.newPage();
    const html = renderHtml(resumeData, templateId);
    await page.setContent(html, { waitUntil: 'networkidle2' });
    await page.emulateMediaType('screen');
    const pdfBuffer = await page.pdf({
      format: 'letter',
      printBackground: true,
      margin: { top: '1in', bottom: '1in', left: '1in', right: '1in' },
    });
    await browser.close();
    // Send PDF buffer as binary response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="resume.pdf"');
    // Explicitly set content length
    res.setHeader('Content-Length', Buffer.isBuffer(pdfBuffer) ? pdfBuffer.length.toString() : String(pdfBuffer.byteLength));
    // End response with PDF data
    res.status(200).end(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}