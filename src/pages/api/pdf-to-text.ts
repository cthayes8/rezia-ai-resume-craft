import type { NextApiRequest, NextApiResponse } from 'next';
import pdfParse from 'pdf-parse';

// Increase body size limit for base64-encoded PDF
export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
  try {
    const { pdfBase64 } = req.body as { pdfBase64?: string };
    if (!pdfBase64 || typeof pdfBase64 !== 'string') {
      return res.status(400).json({ error: 'Missing pdfBase64 in request body' });
    }
    const buffer = Buffer.from(pdfBase64, 'base64');
    const data = await pdfParse(buffer);
    return res.status(200).json({ text: data.text });
  } catch (error: any) {
    console.error('[pdf-to-text] Error:', error);
    return res.status(500).json({ error: 'Failed to parse PDF' });
  }
}