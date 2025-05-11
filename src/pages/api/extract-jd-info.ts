import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { jobDescription } = req.body as { jobDescription?: string };
    if (typeof jobDescription !== 'string') {
      return res.status(400).json({ error: 'Invalid jobDescription' });
    }
    const systemPrompt = `
You are a job description parsing assistant. Extract key information for tailoring a resume. Respond ONLY in valid, minified JSON:
{
  "targetTitle": string,
  "targetCompany": string,
  "requirements": [string]
}
`.trim();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini-2025-04-14',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: jobDescription }
      ],
      temperature: 0,
    });
    let content = completion.choices[0]?.message?.content || '';
    content = content.replace(/```json\s*|```/g, '').trim();
    const data = JSON.parse(content);
    const { targetTitle, targetCompany, requirements } = data;
    if (typeof targetTitle !== 'string' || typeof targetCompany !== 'string' || !Array.isArray(requirements)) {
      throw new Error('Unexpected response format');
    }
    return res.status(200).json({ targetTitle, targetCompany, requirements });
  } catch (err: any) {
    console.error('Error in pages/api/extract-jd-info:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}