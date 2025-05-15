// Score engine for resume optimization: computes keyword match, verb strength, and sentence length metrics
// Scoring engine for resume optimization: core dimensions
export interface ScoreMetric {
  name: string;
  originalScore: number;
  optimizedScore: number;
}

export interface Scorecard {
  overallScore: number;
  metrics: ScoreMetric[];
}
// Flatten structured resume JSON into plain text for full-text scoring
import type { ResumeData } from '@/types/resume';
export function flattenResume(parsed: ResumeData): string {
  const parts: string[] = [];
  if (parsed.summary) parts.push(`Summary: ${parsed.summary}`);
  if (parsed.work) {
    parsed.work.forEach((w) => {
      const job = `Worked at ${w.company} as ${w.title}`;
      parts.push(job);
      if (w.bullets && w.bullets.length) {
        parts.push(`Key achievements: ${w.bullets.join(', ')}`);
      }
    });
  }
  if (parsed.skills && parsed.skills.length) parts.push(`Skills: ${parsed.skills.join(', ')}`);
  if (parsed.education && parsed.education.length) {
    parsed.education.forEach((e) => {
      parts.push(`Education: ${e.degree} at ${e.institution}`);
    });
  }
  if (parsed.projects && parsed.projects.length) {
    parsed.projects.forEach((p) => {
      parts.push(`Project ${p.name}: ${p.description}`);
    });
  }
  return parts.join('. ');
}

// Strength mapping for common action verbs
const VERB_STRENGTH: Record<string, number> = {
  lead: 10,
  execute: 9,
  build: 9,
  manage: 8,
  optimize: 8,
  support: 5,
  help: 4,
  assist: 4,
  work: 3,
};

// Extract simple keywords: unique lower-case words of length >=4
export function extractKeywords(text: string): string[] {
  const tokens = text
    .toLowerCase()
    .match(/\b[a-z]{4,}\b/g) || [];
  return Array.from(new Set(tokens));
}

// Compute percentage of job-description keywords present in resume text
/**
 * Keyword Match score: percentage of JD keywords found in resume text
 */
export function keywordMatchScore(resume: string, jdKeywords: string[]): number {
  if (!jdKeywords.length) return 0;
  const resumeTokens = extractKeywords(resume);
  const matchedCount = jdKeywords.filter((kw) => resumeTokens.includes(kw)).length;
  const score = (matchedCount / jdKeywords.length) * 100;
  return parseFloat(score.toFixed(2));
}

// Compute verb strength: average strength of recognized verbs in text, scaled to 0–100
/**
 * Verb Strength score: normalized average strength of action verbs
 */
export function verbStrengthScore(text: string): number {
  const tokens = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
  const strengths: number[] = [];
  tokens.forEach((tok) => {
    if (VERB_STRENGTH[tok] !== undefined) {
      strengths.push(VERB_STRENGTH[tok]);
    }
  });
  if (!strengths.length) return 0;
  const avg = strengths.reduce((sum, v) => sum + v, 0) / strengths.length;
  const maxStrength = Math.max(...Object.values(VERB_STRENGTH));
  const score = (avg / maxStrength) * 100;
  return parseFloat(score.toFixed(2));
}

/**
 * Bullet Strength score: composite of verb impact, quantification, and conciseness
 */
export function bulletStrengthScore(bullets: string[], idealLen = 20, sigma = 10): number {
  if (!bullets.length) return 0;
  // Verb impact subscore: average strength of first verb per bullet
  const verbScores = bullets.map((b) => {
    const first = b.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, '');
    return VERB_STRENGTH[first] !== undefined ? VERB_STRENGTH[first] : 5;
  });
  const avgVerb = verbScores.reduce((sum, v) => sum + v, 0) / verbScores.length;
  const verbMax = Math.max(...Object.values(VERB_STRENGTH));
  const verbScore = (avgVerb / verbMax) * 100;
  // Quantification subscore: percent of bullets containing digits
  const quantCount = bullets.filter((b) => /\d/.test(b)).length;
  const quantScore = (quantCount / bullets.length) * 100;
  // Conciseness subscore: Gaussian penalty around ideal length
  const lengths = bullets.map((b) => b.split(/\s+/).filter(Boolean).length);
  const avgLen = lengths.reduce((sum, l) => sum + l, 0) / lengths.length;
  const diff = avgLen - idealLen;
  const concScoreRaw = Math.exp(- (diff * diff) / (2 * sigma * sigma)) * 100;
  const concScore = parseFloat(Math.max(0, Math.min(100, concScoreRaw)).toFixed(2));
  // Fluff penalty: detect dead-weight introductory phrases
  const fluffRegex = /^(Responsible for|Worked with|Assisted in)/i;
  const fluffCount = bullets.filter(b => fluffRegex.test(b.trim())).length;
  const fluffScore = parseFloat((((bullets.length - fluffCount) / bullets.length) * 100).toFixed(2));
  // Bloat penalty: penalize bullets longer than threshold words
  const bloatThreshold = 60;
  const bloatCount = lengths.filter(l => l > bloatThreshold).length;
  const bloatScore = parseFloat((((bullets.length - bloatCount) / bullets.length) * 100).toFixed(2));
  // Pattern bonus: reward bullets that follow "Verb → Action → Outcome" (e.g., "Led X by 20%")
  const patternRegex = /^[A-Z]\w+ .+ by \d+%/;
  const patternCount = bullets.filter(b => patternRegex.test(b.trim())).length;
  const patternScore = parseFloat(((patternCount / bullets.length) * 100).toFixed(2));
  // Final composite: average all sub-scores
  const composite = (verbScore + quantScore + concScore + fluffScore + bloatScore + patternScore) / 6;
  return parseFloat(composite.toFixed(2));
}

// Compute sentence length score: ideal length ~20 words, score = 100 - abs(avg - 20)
/**
 * Sentence Length score: ideal average ~20 words, score = 100 - abs(avg-20)
 */
/**
 * Sentence Length score: Gaussian around an ideal length of 20 words
 */
export function sentenceLengthScore(text: string, ideal = 20, sigma = 10): number {
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (!sentences.length) return 0;
  const lengths = sentences.map((s) => s.split(/\s+/).filter(Boolean).length);
  const avg = lengths.reduce((sum, l) => sum + l, 0) / lengths.length;
  // Gaussian penalty: exp(-((avg-ideal)^2)/(2*sigma^2)) * 100
  const diff = avg - ideal;
  const scoreRaw = Math.exp(- (diff * diff) / (2 * sigma * sigma)) * 100;
  const clamped = Math.max(0, Math.min(100, scoreRaw));
  return parseFloat(clamped.toFixed(2));
}

/**
 * Education & Certifications score: 100 if at least one education entry or certification exists
 */
/**
 * Education & Certifications score: combines degree level, field match, cert relevance, and recency.
 * @param parsed structured resume data
 * @param jobDescription full JD text for field and cert matching
 * @returns composite score 0-100
 */
export function educationCertificationsScore(parsed: ResumeData, jobDescription: string): number {
  // 1. Degree Level Ratio (40%)
  const levelMap = (deg: string): number => {
    const d = deg.toLowerCase();
    if (d.includes('phd') || d.includes('doctor')) return 5;
    if (d.includes('master')) return 4;
    if (d.includes('bachelor')) return 3;
    if (d.includes('associate')) return 2;
    if (d.includes('high school')) return 1;
    return 3; // default to bachelor
  };
  const candidateLevels = Array.isArray(parsed.education)
    ? parsed.education.map(e => levelMap(e.degree))
    : [];
  const candidateLevel = candidateLevels.length ? Math.max(...candidateLevels) : 0;
  // infer target degree level from JD
  const jdLevelMapping = [ ['phd',5], ['doctor',5], ['master',4], ['bachelor',3], ['associate',2], ['high school',1] ];
  let targetLevel = 3;
  const jdLower = jobDescription.toLowerCase();
  for (const [kw, lvl] of jdLevelMapping) {
    if (jdLower.includes(kw)) { targetLevel = lvl; break; }
  }
  const degreeScoreRaw = targetLevel > 0 ? (candidateLevel / targetLevel) * 100 : 0;
  const degreeScore = parseFloat(Math.min(100, degreeScoreRaw).toFixed(2));

  // 2. Degree Field Match (20%): default to perfect if no explicit field info
  const jdKeywords = extractKeywords(jobDescription);
  let fieldScore = 100;
  if (Array.isArray(parsed.education) && parsed.education.length) {
    const rawFields = parsed.education
      .map(e => e.field)
      .filter((f): f is string => typeof f === 'string' && f.trim().length > 0);
    if (rawFields.length > 0) {
      const fields = rawFields.map(f => extractKeywords(f));
      const matches = fields.reduce((sum, toks) => sum + (toks.some(t => jdKeywords.includes(t)) ? 1 : 0), 0);
      fieldScore = parseFloat(((matches / fields.length) * 100).toFixed(2));
    }
  }

  // 3. Certification Relevance (25%)
  let certRelScore = 0;
  const certs = Array.isArray(parsed.certifications) ? parsed.certifications : [];
  if (certs.length) {
    // Match only certs with a valid name and check for JD keyword overlap
    const matched = certs.filter(c =>
      typeof c.name === 'string' &&
      jdKeywords.some(kw => c.name.toLowerCase().includes(kw))
    ).length;
    certRelScore = parseFloat(((matched / certs.length) * 100).toFixed(2));
  }

  // 4. Recency Penalty (10%)
  let recencyScore = 100;
  if (certs.length) {
    const now = new Date().getFullYear();
    const recentCount = certs.filter(c => {
      const yearMatch = (c.expiryDate || c.date || '').match(/(\d{4})/);
      const year = yearMatch ? parseInt(yearMatch[1], 10) : now;
      return now - year <= 5;
    }).length;
    recencyScore = parseFloat(((recentCount / certs.length) * 100).toFixed(2));
  }

  // Composite weighted
  const composite =
    degreeScore * 0.4 +
    fieldScore  * 0.2 +
    certRelScore* 0.25 +
    recencyScore* 0.1;
  return parseFloat(Math.min(100, composite).toFixed(2));
}

/**
 * Experience Alignment score: compare average seniority level to target role
 */
export function experienceAlignmentScore(parsed: ResumeData, targetTitle: string): number {
  if (!parsed.work?.length) return 0;
  // Map titles to levels
  const mapLevel = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('intern')) return 1;
    if (t.includes('associate') || t.includes('jr')) return 2;
    if (t.includes('senior') || t.includes('sr')) return 3;
    if (t.includes('lead')) return 4;
    if (t.includes('manager') || t.includes('mgr')) return 5;
    if (t.includes('director')) return 6;
    if (t.includes('vp') || t.includes('vice president')) return 7;
    if (t.includes('chief') || t.includes('c-level')) return 8;
    return 3; // default senior
  };
  const targetLevel = mapLevel(targetTitle);
  // Assign weights: more recent roles count more
  const today = Date.now();
  const entries = parsed.work.map((w) => ({
    level: mapLevel(w.title),
    // parse from date or use a default older date
    from: w.from ? Date.parse(w.from) : 0,
  }));
  // Sort by from descending (newest first)
  entries.sort((a, b) => (b.from || 0) - (a.from || 0));
  const weights = entries.map((_, i) => 1 / (i + 1));
  const totalW = weights.reduce((sum, w) => sum + w, 0);
  const avgLevel = entries.reduce((sum, e, i) => sum + e.level * weights[i], 0) / totalW;
  const scoreRaw = (avgLevel / targetLevel) * 100;
  const clamped = Math.max(0, Math.min(100, scoreRaw));
  return parseFloat(clamped.toFixed(2));
}
/**
 * Extract discrete red-flag warnings from work history:
 * - Gaps >180 days
 * - Roles shorter than 180 days
 * - Overlapping dates
 */
export function extractRedFlags(parsed: ResumeData): string[] {
  const warnings: string[] = [];
  if (!parsed.work?.length) return warnings;
  // Normalize dates
  const entries = parsed.work.map(w => ({
    title: w.title,
    company: w.company,
    from: w.from ? Date.parse(w.from) : null,
    to:   w.to   ? Date.parse(w.to)   : Date.now()
  })).filter(e => e.from !== null) as Array<{title: string; company: string; from: number; to: number}>;
  // Sort by start date
  entries.sort((a, b) => a.from - b.from);
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  // Check gaps and overlaps
  for (let i = 1; i < entries.length; i++) {
    const prev = entries[i - 1];
    const curr = entries[i];
    const gapDays = (curr.from - prev.to) / MS_PER_DAY;
    if (gapDays > 180) {
      warnings.push(
        `Significant gap of ${Math.round(gapDays)} days between ${prev.title} at ${prev.company} and ${curr.title} at ${curr.company}.`
      );
    }
    if (curr.from < prev.to) {
      warnings.push(
        `Overlap detected between ${prev.title} at ${prev.company} and ${curr.title} at ${curr.company}.`
      );
    }
  }
  // Check short durations
  entries.forEach(e => {
    const durDays = (e.to - e.from) / MS_PER_DAY;
    if (durDays < 180) {
      warnings.push(
        `${e.title} at ${e.company} lasted only ${Math.round(durDays)} days.`
      );
    }
  });
  return warnings;
}

/**
 * Red Flags score: penalties for gaps and short roles
 */
export function redFlagsScore(parsed: ResumeData): number {
  if (!parsed.work?.length) return 100;
  // Parse roles with dates
  const roles = parsed.work.map((w) => ({
    from: w.from ? Date.parse(w.from) : 0,
    to: w.to ? Date.parse(w.to) : Date.now(),
  }));
  // Sort by from date
  roles.sort((a, b) => (a.from || 0) - (b.from || 0));
  let flags = 0;
  // Gaps > 180 days
  for (let i = 1; i < roles.length; i++) {
    const gap = (roles[i].from - roles[i-1].to) / (1000 * 60 * 60 * 24);
    if (gap > 180) flags++;
  }
  // Job-hopping: roles shorter than 365 days
  roles.forEach((r) => {
    const dur = (r.to - r.from) / (1000 * 60 * 60 * 24);
    if (dur < 365) flags++;
  });
  // Map flags to score
  let score;
  if (flags === 0) score = 100;
  else if (flags === 1) score = 75;
  else if (flags === 2) score = 50;
  else if (flags === 3) score = 25;
  else score = 0;
  return score;
}

// Build a scorecard comparing original vs optimized against job description
export function buildScorecard(
  original: string,
  optimized: string,
  jobDescription: string
): Scorecard {
  const jdKeywords = extractKeywords(jobDescription);
  const origKeyword = keywordMatchScore(original, jdKeywords);
  const optKeyword = keywordMatchScore(optimized, jdKeywords);
  const origVerb = verbStrengthScore(original);
  const optVerb = verbStrengthScore(optimized);
  const origSentLen = sentenceLengthScore(original);
  const optSentLen = sentenceLengthScore(optimized);
  const overall = Math.round((optKeyword + optVerb + optSentLen) / 3);
  return {
    overallScore: overall,
    metrics: [
      { name: 'Keyword Match', originalScore: origKeyword, optimizedScore: optKeyword },
      { name: 'Action Verb Strength', originalScore: origVerb, optimizedScore: optVerb },
      { name: 'Sentence Length', originalScore: origSentLen, optimizedScore: optSentLen },
    ],
  };
}

/**
 * Formatting & Structure score: based on presence of key sections in structured data
 */
export function formattingScore(parsed: ResumeData): number {
  // Section presence score
  const sections = [
    { name: 'Summary',    present: !!parsed.summary?.trim() },
    { name: 'Experience', present: Array.isArray(parsed.work) && parsed.work.length > 0 },
    { name: 'Education',  present: Array.isArray(parsed.education) && parsed.education.length > 0 },
    { name: 'Skills',     present: Array.isArray(parsed.skills) && parsed.skills.length > 0 },
    { name: 'Projects',   present: Array.isArray(parsed.projects) && parsed.projects.length > 0 },
  ];
  const presentCount = sections.filter(s => s.present).length;
  const presenceScore = (presentCount / sections.length) * 100;
  // Section order score (using flattened text markers)
  const flat = flattenResume(parsed);
  const markers: Record<string,string> = {
    Summary:    'Summary:',
    Experience: 'Worked at',
    Education:  'Education:',
    Skills:     'Skills:',
    Projects:   'Project '
  };
  const desiredOrder = sections.filter(s => s.present).map(s => s.name);
  const actualOrder = sections
    .filter(s => s.present)
    .map(s => ({ name: s.name, idx: flat.indexOf(markers[s.name]) }))
    .sort((a,b) => a.idx - b.idx)
    .map(s => s.name);
  const matches = actualOrder.reduce((sum, name, i) => sum + (name === desiredOrder[i] ? 1 : 0), 0);
  const orderScore = desiredOrder.length > 0 ? (matches / desiredOrder.length) * 100 : 100;
  // Skills section length score: ideal 5-15, penalize if <5 or >20
  const len = Array.isArray(parsed.skills) ? parsed.skills.length : 0;
  let skillsLenScore = 0;
  if (len === 0) {
    skillsLenScore = 0;
  } else if (len >= 5 && len <= 15) {
    skillsLenScore = 100;
  } else if (len < 5) {
    skillsLenScore = (len / 5) * 100;
  } else {
    skillsLenScore = ((20 / len) * 100);
  }
  skillsLenScore = parseFloat(Math.max(0, Math.min(100, skillsLenScore)).toFixed(2));
  // Placeholder indent and noise scores (to be enhanced later)
  const indentScore = 100;
  const noiseScore = 100;
  // Combine all formatting sub-scores
  const composite = (presenceScore + orderScore + skillsLenScore + indentScore + noiseScore) / 5;
  return parseFloat(composite.toFixed(2));
}

/**
 * Skill Coverage score: percentage of JD requirements found in structured skills list
 */
export function skillCoverageScore(parsed: ResumeData, requirements: string[]): number {
  if (!requirements || requirements.length === 0) return 0;
  const skills = parsed.skills?.map((s) => s.toLowerCase()) || [];
  const matched = requirements.filter((req) =>
    skills.includes(req.toLowerCase())
  ).length;
  const score = (matched / requirements.length) * 100;
  return parseFloat(score.toFixed(2));
}

/**
 * Readability score: uses Flesch Reading Ease (0–100)
 */
/** Weights for each metric used in overall score */
export const metricWeights: Record<string, number> = {
  'Keyword Match': 30,
  'Experience Alignment': 20,
  'Bullet Strength': 15,
  'Role Alignment': 10,
  'Skills Match': 10,
  'Education & Certifications': 5,
  'Formatting & Structure': 5,
  'Customization Level': 5,
};

/** Compute weighted average of optimizedScore values */
export function weightedAverage(metrics: ScoreMetric[]): number {
  const totalWeight = metrics.reduce((sum, m) => sum + (metricWeights[m.name] || 0), 0);
  if (totalWeight === 0) return 0;
  const weightedSum = metrics.reduce(
    (sum, m) => sum + (m.optimizedScore * (metricWeights[m.name] || 0)),
    0
  );
  const avg = weightedSum / totalWeight;
  return parseFloat(avg.toFixed(2));
}