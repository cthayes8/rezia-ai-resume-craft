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
    const { html, templateId } = req.body as { html?: string; templateId?: number };
    if (!html) {
      return res.status(400).json({ error: 'Missing HTML content' });
    }
    // Determine body class based on templateId (1=classic, 2=modern, 3=tech)
    const templateClass =
      templateId === 2 ? 'template-modern' :
      templateId === 3 ? 'template-tech' :
      'template-classic';
    // Wrap HTML with template CSS and class for accurate styling
    const fullHtml = `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<style>${templateCss}</style>
</head>
<body class="${templateClass}">${html}</body>
</html>`;
    // Inline all critical CSS so Word sees the exact styles
    const { default: inlineCss } = await import('inline-css');
    const inlinedHtml = await inlineCss(fullHtml, {
      url: ' ',                 // base URL for resolving relative paths
      applyStyleTags: true,     // apply <style> blocks inline
      removeStyleTags: true,    // remove the <style> blocks after inlining
      applyLinkTags: true,      // apply <link rel="stylesheet"> if present
    });
    // Convert inlined HTML to ArrayBuffer for .docx
    const buffer = await htmlToDocx(inlinedHtml, null, {
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