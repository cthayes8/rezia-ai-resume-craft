import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import type { Project } from '@/types/resume';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  try {
    const {
      projects,
      keywords,
      requirements,
      targetTitle,
      targetCompany,
      jobDescription,
      skills,
      summary
    } = req.body as {
      projects?: Project[];
      keywords?: string[];
      requirements?: string[];
      targetTitle?: string;
      targetCompany?: string;
      jobDescription?: string;
      skills?: string[];
      summary?: string;
    };
    if (!Array.isArray(projects) || projects.length === 0) {
      return res.status(200).json({ rewrittenProjects: [] });
    }
    const systemPrompt = `
You are a world-class resume editor.

Your task is to rewrite each project entry to highlight impact, technologies used, and alignment with the target role.

Guidelines:
- Begin with the project name in bold.
- For each project, write 2-3 concise sentences that describe the challenge, your solution, and quantifiable impact.
- Mention key technologies naturally.
- Align your language to the ${targetTitle} role requirements provided.
- Do not fabricate details; use only information from the original entries.
- Return valid JSON: { "rewrittenProjects": [ { "name": string, "description": string, "technologies": string[] }, ... ] }
`.trim();
    const projectsList = projects.map(p => `- ${p.name}: ${p.description}`).join('\n');
    const userPrompt = `
PROJECTS:
${projectsList}

CONTEXT:
- Target Role: ${targetTitle} at ${targetCompany}
- Requirements: ${requirements?.join('; ')}
- Keywords: ${keywords?.join(', ')}
- Skills: ${skills?.join(', ')}
- Summary: ${summary}
`.trim();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini-2025-04-14',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
    });
    let content = completion.choices[0]?.message?.content?.trim() || '';
    // Ensure JSON
    if (!content.startsWith('{')) {
      // try to extract JSON
      const match = content.match(/\{[\s\S]*\}/);
      content = match ? match[0] : content;
    }
    const data = JSON.parse(content) as { rewrittenProjects: Project[] };
    return res.status(200).json({ rewrittenProjects: data.rewrittenProjects });
  } catch (err) {
    console.error('Error in rewrite-projects API:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}