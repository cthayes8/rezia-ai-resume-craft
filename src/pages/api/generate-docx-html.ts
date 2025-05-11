import type { NextApiRequest, NextApiResponse } from 'next';
import htmlToDocx from 'html-to-docx';
import fs from 'fs';
import path from 'path';

// Inline template CSS for DOCX conversion
const templateCssPath = path.join(process.cwd(), 'public', 'templates.css');
let templateCss = '';
try {
  templateCss = fs.readFileSync(templateCssPath, 'utf8');
} catch (err) {
  console.warn('[generate-docx-html] Could not read templates.css:', err);
}

/**
 * Generate a .docx file from HTML content.
 * Expects body: { html: string }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
  try {
    const { html } = req.body as { html?: string };
    if (!html) {
      return res.status(400).json({ error: 'Missing HTML content' });
    }
    // Wrap HTML with template CSS for accurate styling
    const fullHtml = `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<style>${templateCss}</style>
</head>
<body>${html}</body>
</html>`;
    // Convert HTML to ArrayBuffer for .docx
    const buffer = await htmlToDocx(fullHtml, null, {
      table: { row: { cantSplit: true } },
      footer: true,
      pageNumber: false,
    });
    // Send as attachment
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    res.setHeader('Content-Disposition', 'attachment; filename="resume.docx"');
    return res.send(buffer);
  } catch (error) {
    console.error('[generate-docx-html] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}