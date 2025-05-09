import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import type { ResumeData, MapKeywordsResponse } from '@/types/resume';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  const { resumeData, keywords } = req.body as { resumeData?: ResumeData; keywords?: string[] };
  if (!resumeData || !Array.isArray(keywords)) {
    return res.status(400).json({ error: 'Missing resumeData or keywords' });
  }
  try {
    const systemPrompt = `
You are a resume keyword mapping assistant.

Your task is to assign the most relevant keywords to each resume bullet based on content overlap, relevance, and intent.

Rules:
- Only assign keywords to work experience bullets (not summary, education, or skills).
- A keyword may appear in **no more than 3 bullets** total.
- A bullet may have **multiple relevant keywords** assigned.
- Only include bullets that have at least one keyword assigned.
- Do NOT include full bullet text—just indexes.

Output ONLY valid minified JSON as:
[
  {
    "workIndex": number,          // index of the job in resumeData.work[]
    "bulletIndex": number,        // index of the bullet in work[workIndex].bullets[]
    "assignedKeywords": [string]  // assigned relevant keywords
  }
]
`.trim();
    const userPrompt = `
Resume JSON (work section only):
${JSON.stringify(resumeData.work)}

Keywords to assign:
${JSON.stringify(keywords)}
`.trim();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini-2025-04-14',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });
    let content = completion.choices[0]?.message?.content || '';
    content = content.replace(/```json\s*|```/g, '').trim();
    let assignments;
    try {
      assignments = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse map-keywords JSON:', content);
      return res.status(500).json({ error: 'Invalid JSON from AI' });
    }
    if (!Array.isArray(assignments)) {
      return res.status(500).json({ error: 'Unexpected response format' });
    }
    const result: MapKeywordsResponse = { assignments };
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in map-keywords API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}