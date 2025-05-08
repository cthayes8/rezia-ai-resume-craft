import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import CryptoJS from 'crypto-js';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { ResumeData } from '@/types/resume';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * API Route: Parse uploaded resume text (encrypted or plain) into structured JSON.
 * Uses Affinda API if AFFINDA_API_KEY is provided, otherwise falls back to GPT.
 */
export async function POST(req: Request) {
  try {
    const { resume: encryptedResume, jobDescription } = await req.json();
    // Debug: log incoming payload snippets to verify input
    console.log('🔥 [parse-resume] incoming:', {
      resumeSnippet: typeof encryptedResume === 'string'
        ? encryptedResume.substring(0, 200) + (encryptedResume.length > 200 ? '...' : '')
        : encryptedResume,
      jobDescriptionSnippet: typeof jobDescription === 'string'
        ? jobDescription.substring(0, 200) + (jobDescription.length > 200 ? '...' : '')
        : jobDescription
    });
    
    if (typeof encryptedResume !== 'string') {
      return NextResponse.json(
        { error: 'Missing resume text' },
        { status: 400 }
      );
    }

    // Decrypt if encryption secret provided
    let resumeText = encryptedResume;
    if (process.env.ENCRYPTION_SECRET) {
      try {
        const bytes = CryptoJS.AES.decrypt(encryptedResume, process.env.ENCRYPTION_SECRET);
        resumeText = bytes.toString(CryptoJS.enc.Utf8);
      } catch {
        // fall back to original text
      }
    }

    let parsed: ResumeData;
    if (process.env.AFFINDA_API_KEY) {
      // Integrate Affinda resume parser API
      const form = new FormData();
      form.append('file', Buffer.from(resumeText), { filename: 'resume.txt' });
      const affRes = await fetch('https://api.affinda.com/v1/resumes/parser', {
        method: 'POST',
        headers: { Authorization: `Token ${process.env.AFFINDA_API_KEY}` },
        body: form as any,
      });
      const affJson = await affRes.json();
      // TODO: Map Affinda JSON response to ResumeData schema
      // parsed = mapAffindaToResumeData(affJson);
      parsed = affJson as any;
    } else {
      // Fallback: use GPT to parse into JSON
      const systemPrompt = `Parse the following resume into JSON with these exact fields: {\n  "name": string,\n  "contact": { "email": string, "phone": string, "link": string },\n  "summary": string,\n  "work": [ { "company": string, "title": string, "from": string, "to": string, "bullets": [string] } ],\n  "education": [ { "institution": string, "degree": string, "from": string, "to": string } ],\n  "skills": [string],\n  "awards": [string],\n  "certifications": [string]\n}\nRespond with valid JSON only, no extra fields.`;
      const userPrompt = `Resume:\n${resumeText}`;
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini-2024-07-18',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      });
      let content = completion.choices[0]?.message?.content || '';
      content = content.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(content);
    }

    return NextResponse.json({ parsedResume: parsed });
  } catch (error) {
    console.error('Error in parse-resume API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}