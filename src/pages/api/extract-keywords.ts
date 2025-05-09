import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  const { jobDescription } = req.body;
  if (typeof jobDescription !== 'string') {
    return res.status(400).json({ error: 'Invalid jobDescription' });
  }
  try {
    const systemPrompt = `Extract the 5 to 10 most important skills or keywords from a job description. Respond with valid JSON only: { "keywords": [string] }.`;
    const userPrompt = jobDescription;
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini-2025-04-14',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });
    let content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content returned from AI');
    }
    content = content.replace(/```json\s*|```/g, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse keywords JSON:', content);
      return res.status(500).json({ error: 'Failed to parse AI output as JSON' });
    }
    if (!Array.isArray(parsed.keywords)) {
      return res.status(500).json({ error: 'Unexpected response format' });
    }
    return res.status(200).json({ keywords: parsed.keywords });
  } catch (error) {
    console.error('Error in extract-keywords API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}