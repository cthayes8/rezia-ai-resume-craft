import type { NextApiRequest, NextApiResponse } from 'next';
import { createHash } from 'crypto';
import OpenAI from 'openai';
import CryptoJS from 'crypto-js';
import type { ResumeData } from '@/types/resume';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions.mjs';

// In-memory cache for parsed resumes (persists across warm lambda invocations)
declare global {
  var _parsedResumeCache: Map<string, ResumeData> | undefined;
}
const parsedCache = global._parsedResumeCache || new Map<string, ResumeData>();
if (process.env.NODE_ENV !== 'production') {
  global._parsedResumeCache = parsedCache;
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { resume: encryptedResume } = req.body as { resume?: string };

    if (!encryptedResume) {
      return res.status(400).json({ error: 'Missing resume text' });
    }

    // Decrypt resume if necessary
    let resumeText = encryptedResume;
    if (process.env.ENCRYPTION_SECRET) {
      try {
        const bytes = CryptoJS.AES.decrypt(encryptedResume, process.env.ENCRYPTION_SECRET);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        if (decrypted) resumeText = decrypted;
      } catch (err) {
        console.warn('[parse-resume] Decryption failed, using raw input.');
      }
    }

    // Normalize and hash
    const normalized = resumeText.replace(/\s+/g, ' ').trim();
    const hash = createHash('sha256').update(normalized).digest('hex');

    if (parsedCache.has(hash)) {
      return res.status(200).json({ parsedResume: parsedCache.get(hash) });
    }

    // Unified system prompt (ask for everything at once)
    const systemPrompt = `
You are a professional resume parser. Read the full resume and return valid JSON with the following fields:
- name
- contact: { email, phone, link }
- summary
- work: [ { company, title, from, to, bullets[] } ]
- education: [ { institution, degree, from, to } ]
- skills[]
- certifications[]
- awards[]

Rules:
- Capture all bullets under each role in work history.
- For bullets, split entries on lines starting with '-', '•', or '*' and remove the marker. If bullet markers are not present, split on line breaks to separate distinct points.
- Only return structured, valid JSON with no extra text.
- Do your best to infer missing dates if not present.
- Include all available contact details (even if not labeled clearly).
`.trim();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini-2025-04-14',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: resumeText }
      ],
      temperature: 0,
    });

    const parsed = completion.choices[0]?.message?.content;
    if (!parsed) throw new Error('No response from LLM.');

    const parsedJson: ResumeData = JSON.parse(parsed);
    parsedCache.set(hash, parsedJson);

    return res.status(200).json({ parsedResume: parsedJson });
  } catch (err: any) {
    console.error('[parse-resume] Error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}