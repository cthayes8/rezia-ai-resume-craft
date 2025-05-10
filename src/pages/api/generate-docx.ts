// generate-docx.ts — generates DOCX resumes with full template styling + bullets + updated Template 2 (restaurant-manager layout)

import type { NextApiRequest, NextApiResponse } from 'next';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from 'docx';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { resumeData, templateId } = req.body as { resumeData: any; templateId?: number };
    if (!resumeData) {
      return res.status(400).json({ error: 'Missing resumeData' });
    }

    const styleMap: Record<number, any> = {
      1: {
        font: 'Georgia',
        color: '222222',
        bulletChar: '•',
        h2: { size: 21, spacing: { before: 300, after: 100 }, bold: true },
        h3: { size: 20, spacing: { before: 200, after: 50 }, bold: true },
        bullet: { size: 20, spacing: { after: 100 } },
        nameSize: 42,
        contactSize: 22,
      },
      2: {
        font: 'Calibri',
        color: '000000',
        bulletChar: '•',
        h2: { size: 24, spacing: { before: 280, after: 120 }, bold: true },
        h3: { size: 22, spacing: { before: 180, after: 80 }, bold: false },
        bullet: { size: 22, spacing: { after: 100 } },
        nameSize: 40,
        contactSize: 22,
      },
      3: {
        font: 'Helvetica',
        color: '3B82F6',
        bulletChar: '▪',
        h2: { size: 20, spacing: { before: 320, after: 80 }, bold: true, border: { style: BorderStyle.SINGLE, color: '3B82F6', size: 12 } },
        h3: { size: 19, spacing: { before: 200, after: 40 }, bold: true },
        bullet: { size: 19, spacing: { after: 90 } },
        nameSize: 42,
        contactSize: 23,
      }
    };

    const style = styleMap[templateId] || styleMap[1];

    const makeParagraph = (text: string, opts: any = {}) =>
      new Paragraph({
        spacing: opts.spacing,
        border: opts.border ? { left: opts.border } : undefined,
        alignment: opts.alignment || AlignmentType.LEFT,
        children: [
          new TextRun({
            text,
            size: opts.size,
            bold: opts.bold,
            font: style.font,
            color: opts.color || style.color,
          }),
        ],
      });

    const makeBullet = (text: string) =>
      new Paragraph({
        spacing: style.bullet.spacing,
        children: [
          new TextRun({
            text: `${style.bulletChar} `,
            bold: true,
            font: style.font,
            size: style.bullet.size,
          }),
          new TextRun({
            text,
            font: style.font,
            size: style.bullet.size,
          }),
        ],
      });

    const fullContent = [
      makeParagraph(resumeData.name || '', {
        size: style.nameSize,
        bold: true,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
        children: [
          new TextRun({ text: resumeData.contact.address || '', font: style.font, size: style.contactSize }),
          new TextRun({ text: ' | ', size: style.contactSize }),
          new TextRun({ text: resumeData.contact.phone || '', font: style.font, size: style.contactSize }),
          new TextRun({ text: ' | ', size: style.contactSize }),
          new TextRun({ text: resumeData.contact.email || '', font: style.font, size: style.contactSize }),
          new TextRun({ text: ' | ', size: style.contactSize }),
          new TextRun({ text: resumeData.contact.link || '', font: style.font, size: style.contactSize }),
        ],
      }),
      makeParagraph('Profile', style.h2),
      makeParagraph(resumeData.summary || '', { size: style.bullet.size, spacing: { after: 200 } }),
      makeParagraph('Experience', style.h2),
      ...((resumeData.work || []).map((job: any) => [
        makeParagraph(`${job.title} | ${job.company} | ${job.from || ''} – ${job.to || ''}`, style.h3),
        ...(job.bullets || []).map((b: string) => makeBullet(b)),
      ])).flat(),
      makeParagraph('Education', style.h2),
      ...((resumeData.education || []).map((edu: any) =>
        makeParagraph(`${edu.degree} | ${edu.institution} | ${edu.to || ''}`, {
          size: style.bullet.size,
          spacing: { after: 180 },
        })
      )),
      makeParagraph('Skills & Abilities', style.h2),
      ...((resumeData.skills || []).map((skill: string) => makeBullet(skill))),
      ...(resumeData.activities?.length
        ? [
            makeParagraph('Activities and Interests', style.h2),
            ...resumeData.activities.map((a: string) => makeBullet(a)),
          ]
        : []),
    ];

    const doc = new Document({
      sections: [
        {
          children: fullContent,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename="resume.docx"');
    res.send(buffer);
  } catch (error) {
    console.error('Error generating DOCX:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
