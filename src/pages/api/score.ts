import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import {
  flattenResume,
  extractKeywords,
  keywordMatchScore,
  verbStrengthScore,
  bulletStrengthScore,
  sentenceLengthScore,
  formattingScore,
  skillCoverageScore,
  educationCertificationsScore,
  experienceAlignmentScore,
  // redFlagsScore, (deprecated, replaced by extractRedFlags)
  metricWeights,
  weightedAverage,
  Scorecard,
  extractRedFlags,
} from '@/lib/scoreEngine';
import type { ResumeData } from '@/types/resume';

/**
 * API route to compute and persist a resume optimization scorecard
 * Expects POST with JSON { runId: string }
 */
// Initialize OpenAI client for LLM-based metrics
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Scorecard | { error: string }>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
  // Authenticate user via Clerk
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { runId } = req.body as { runId?: string };
  if (!runId) {
    return res.status(400).json({ error: 'Missing runId' });
  }
  // Lookup the optimization run and ensure existence
  const run = await prisma.optimizationRun.findUnique({ where: { id: runId } });
  if (!run) {
    return res.status(404).json({ error: 'Run not found' });
  }
  if (run.userId !== userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  // Pull out raw data; parse stored JSON into structured data
  const { originalText, optimizedText, jobDescription, keywords, requirements, bulletRewrites } = run;
  const origParsed = JSON.parse(originalText) as ResumeData;
  const optParsed = JSON.parse(optimizedText) as ResumeData;
  // Flatten structured resume into plain text for full-text metrics
  const origFlat = flattenResume(origParsed);
  const optFlat = flattenResume(optParsed);
  // Core metrics (heuristic)
  // Compute or fallback keywords and requirements
  const jdKeywords = Array.isArray(keywords) && keywords.length > 0
    ? (keywords as string[])
    : extractKeywords(jobDescription);
  // Fallback: extract lines starting with '-' or '•' as requirements
  const extractRequirementsFromText = (text: string): string[] =>
    text.split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.startsWith('-') || l.startsWith('•'))
      .map((l) => l.replace(/^[-•]\s*/, ''));
  const reqs = Array.isArray(requirements) && requirements.length > 0
    ? (requirements as string[])
    : extractRequirementsFromText(jobDescription);
  // Extract original bullets from structured resume data
  // (use the parsed work.bullets array rather than raw JSON text)
  const originalBullets = Array.isArray(origParsed.work)
    ? origParsed.work.flatMap((w) => Array.isArray(w.bullets) ? w.bullets : [])
    : [];
  const optimizedBullets = Array.isArray(bulletRewrites)
    ? (bulletRewrites as any[]).map((b) => b.rewrittenBullet as string)
    : [];
  // Compute heuristic scores using structured data
  let origKeyword = keywordMatchScore(origFlat, jdKeywords);
  let optKeyword = keywordMatchScore(optFlat, jdKeywords);
  // Fallback via LLM if heuristic failed to extract any keywords
  if (origKeyword === 0 || optKeyword === 0) {
    try {
      const keyPrompt = `Given this job description:\n${jobDescription}\n` +
        `Original resume text:\n${origFlat}\n` +
        `Optimized resume text:\n${optFlat}\n` +
        `Return only JSON: {"original": <score 0-100>, "optimized": <score 0-100>} for keyword relevance.`;
      const keyRes = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You score resume keyword match against a job description.' },
          { role: 'user', content: keyPrompt }
        ],
        temperature: 0,
      });
      const keyContent = keyRes.choices[0].message.content || '';
      const keyMatch = keyContent.match(/\{[\s\S]*\}/);
      if (keyMatch) {
        const keyJson = JSON.parse(keyMatch[0]);
        origKeyword = Math.min(100, Math.max(0, Number(keyJson.original) || 0));
        optKeyword = Math.min(100, Math.max(0, Number(keyJson.optimized) || 0));
      }
    } catch (e) {
      console.error('[score] Keyword match LLM fallback error', e);
    }
  }
  // Bullet strength metric (continuous composite)
  const origVerb = bulletStrengthScore(originalBullets);
  const optVerb = bulletStrengthScore(optimizedBullets);
  // Remove sentenceLength (integrated into readability if desired)
  // const origSentLen = sentenceLengthScore(origFlat);
  // const optSentLen = sentenceLengthScore(optFlat);
  const origFormat = formattingScore(origParsed);
  const optFormat = formattingScore(optParsed);
  let origSkill = skillCoverageScore(origParsed, reqs);
  let optSkill = skillCoverageScore(optParsed, reqs);
  // Education & Certifications score
  const origEdu = educationCertificationsScore(origParsed, jobDescription);
  const optEdu = educationCertificationsScore(optParsed, jobDescription);
  // Customization Level: embedding similarity
  let origCustom = 0, optCustom = 0;
  try {
    const texts = [jobDescription, flattenResume(origParsed), flattenResume(optParsed)];
    const embRes = await openai.embeddings.create({ model: 'text-embedding-ada-002', input: texts });
    const embs = embRes.data.map(d => d.embedding as number[]);
    const [jobEmb, origEmb, optEmb] = embs;
    const cosine = (a: number[], b: number[]) => {
      const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
      const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
      const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
      return magA && magB ? dot / (magA * magB) : 0;
    };
    origCustom = parseFloat((cosine(jobEmb, origEmb) * 100).toFixed(2));
    optCustom = parseFloat((cosine(jobEmb, optEmb) * 100).toFixed(2));
  } catch (e) {
    console.error('[score] Customization Level embedding error', e);
  }
  // Fallback via LLM if no skills matched
  if (origSkill === 0 || optSkill === 0) {
    try {
      const skillPrompt = `Given this job description:\n${jobDescription}\n` +
        `Original resume text:\n${origFlat}\n` +
        `Optimized resume text:\n${optFlat}\n` +
        `Return only JSON: {"original": <score 0-100>, "optimized": <score 0-100>} for skill coverage.`;
      const skillRes = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You score resume skill coverage against a job description.' },
          { role: 'user', content: skillPrompt }
        ],
        temperature: 0,
      });
      const skillContent = skillRes.choices[0].message.content || '';
      const skillMatch = skillContent.match(/\{[\s\S]*\}/);
      if (skillMatch) {
        const skillJson = JSON.parse(skillMatch[0]);
        origSkill = Math.min(100, Math.max(0, Number(skillJson.original) || 0));
        optSkill = Math.min(100, Math.max(0, Number(skillJson.optimized) || 0));
      }
    } catch (e) {
      console.error('[score] Skill coverage LLM fallback error', e);
    }
  }
  // Remove Readability metric: no longer scored
  // Role Alignment via LLM: compare resume roles to JD responsibilities and scope
  let origRole = 0, optRole = 0;
  try {
    const systemPrompt = `
You are an expert resume evaluator. Your task is to compare a resume to a job description and assess how well the candidate's roles align with the target role.
Role alignment includes:
- Matching job titles and responsibilities
- Similarity in seniority level and scope of work
- Use of tools, processes, or strategies mentioned in the JD
- Alignment of business impact and outcomes

Score each resume (original and optimized) from 0 to 100 based on its alignment to the job description. Return strictly JSON in the format:
{"original": score, "optimized": score}
`.trim();
    const userPrompt = `
Job Description:
${jobDescription}

Original Resume:
${origFlat}

Optimized Resume:
${optFlat}
`.trim();
    const roleRes = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0,
    });
    const content = roleRes.choices?.[0]?.message.content || '';
    const match = content.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      origRole = Math.min(100, Math.max(0, Number(parsed.original) || 0));
      optRole  = Math.min(100, Math.max(0, Number(parsed.optimized) || 0));
    }
  } catch (err) {
    console.error('[score] Role alignment LLM error', err);
  }
  // Experience Alignment: heuristic fallback then LLM-based seniority alignment
  let origExpAlign = experienceAlignmentScore(origParsed, jobDescription);
  let optExpAlign = experienceAlignmentScore(optParsed, jobDescription);
  try {
    // Build prompt with roles and bullets for both original and optimized
    const origRolesText = origParsed.work.map(w => `- ${w.title}: ${w.bullets.join('; ')}`).join('\n');
    const optRolesText  = optParsed.work.map(w  => `- ${w.title}: ${w.bullets.join('; ')}`).join('\n');
    const expPrompt =
      `Given the job description:\n${jobDescription}\n\n` +
      `Original roles and bullets:\n${origRolesText}\n\n` +
      `Optimized roles and bullets:\n${optRolesText}\n\n` +
      `Return only JSON with fields {"original":<0-100>,"optimized":<0-100>} representing seniority alignment percentages.`;
    const expRes = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You score resume seniority alignment against a job description.' },
        { role: 'user', content: expPrompt }
      ],
      temperature: 0,
    });
    const expContent = expRes.choices[0].message.content || '';
    const expMatch = expContent.match(/\{[\s\S]*\}/);
    if (expMatch) {
      const j = JSON.parse(expMatch[0]);
      origExpAlign = Math.min(100, Math.max(0, Number(j.original) || 0));
      optExpAlign  = Math.min(100, Math.max(0, Number(j.optimized) || 0));
    }
  } catch (err) {
    console.error('[score] Seniority alignment LLM error', err);
  }
  // Red Flags: extract discrete warning messages from optimized resume
  const redFlagsList = extractRedFlags(optParsed);
  // Assemble metrics
  const metrics = [
    { name: 'Keyword Match', originalScore: origKeyword, optimizedScore: optKeyword },
    { name: 'Experience Alignment', originalScore: origExpAlign, optimizedScore: optExpAlign },
    { name: 'Bullet Strength', originalScore: origVerb, optimizedScore: optVerb },
    { name: 'Role Alignment', originalScore: origRole, optimizedScore: optRole },
    { name: 'Skills Match', originalScore: origSkill, optimizedScore: optSkill },
    { name: 'Education & Certifications', originalScore: origEdu, optimizedScore: optEdu },
    { name: 'Formatting & Structure', originalScore: origFormat, optimizedScore: optFormat },
    { name: 'Customization Level', originalScore: origCustom, optimizedScore: optCustom }
  ];
  // Compute final overall scores using weighted average for optimized and original
  const overallScore = weightedAverage(metrics);
  // Compute original overall score by applying weights to originalScore values
  const originalOverallScore = weightedAverage(
    metrics.map(m => ({ name: m.name, originalScore: m.originalScore, optimizedScore: m.originalScore }))
  );
  // Persist in database
  try {
    await prisma.scorecard.upsert({
      where: { optimizationRunId: runId },
      update: { overallScore, metrics, redFlags: redFlagsList },
      create: {
        overallScore,
        metrics,
        redFlags: redFlagsList,
        optimizationRun: { connect: { id: runId } },
      },
    });
  } catch (err) {
    console.error('[score] Error upserting scorecard:', err);
  }
  // Return overall scores, detailed metrics, and red-flag warnings
  return res.status(200).json({
    overallScore,
    originalOverallScore,
    metrics,
    redFlags: redFlagsList,
  });
}