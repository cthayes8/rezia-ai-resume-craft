import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { createHash } from 'crypto';
import OpenAI from 'openai';
// Initialize OpenAI client for ATS scoring
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

import type { ResumeData, ExtractJDInfoResponse, ParseResumeResponse, MapKeywordsResponse, RewriteBulletResponse, RewriteSummaryResponse, RewriteSkillsResponse, OptimizationRunData, BulletRewriteResult } from '@/types/resume';
// heavy parsing steps moved to Pages API for faster warm lambdas
// Removed direct import of internal API handlers; using HTTP fetch to Pages API instead

export const runtime = 'nodejs';

interface OptimizeResumeRequest {
  resumeText?: string;
  /**
   * Optional parsed resume data to skip parsing step
   */
  resumeData?: ResumeData;
  jobDescription: string;
  templateId?: string;
  fileName?: string;
}

/**
 * API Route: Full orchestration of resume optimization as a single Node.js function
 */
export async function POST(req: Request) {
  try {
    const { resumeText, resumeData, jobDescription, templateId, fileName } = (await req.json()) as OptimizeResumeRequest;
    if (!jobDescription || (!resumeText && !resumeData)) {
      return NextResponse.json({ error: 'Missing resumeData or resumeText, and jobDescription' }, { status: 400 });
    }

    // Authenticate user & enforce free-tier quota
    const { userId, has } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Ensure user record exists without violating email unique constraints
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const email = clerkUser.emailAddresses[0]?.emailAddress || '';
    const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim();
    let dbUser = await prisma.user.findUnique({ where: { id: userId } });
    if (dbUser) {
      dbUser = await prisma.user.update({
        where: { id: userId },
        data: { email, fullName },
      });
    } else {
      const emailUser = await prisma.user.findUnique({ where: { email } });
      if (emailUser) {
        dbUser = await prisma.user.update({
          where: { email },
          data: { fullName },
        });
      } else {
        dbUser = await prisma.user.create({
          data: { id: userId, email, fullName },
        });
      }
    }

    // Enforce free-tier quota using freeRunsRemaining
    if (has({ plan: 'free_user' })) {
      if (dbUser.freeRunsRemaining <= 0) {
        return NextResponse.json(
          { error: 'Free tier quota exhausted', needUpgrade: true },
          { status: 402 }
        );
      }
    }

    // Prepare baseUrl for API calls
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const host = req.headers.get('host');
    const baseUrl = `${protocol}://${host}`;
    // Always save resume file metadata so we have a file record
    const rawText = resumeText ?? '';
    const normalizedText = rawText.replace(/\s+/g, ' ').trim();
    const originalTextHash = createHash('sha256').update(normalizedText).digest('hex');
    // Create resume file record linked to the correct DB user
    const resumeFile = await prisma.resumeFile.create({
      data: { userId: dbUser.id, fileName: fileName || '', filePath: '', originalTextHash },
    });
    
    // Determine parsed resume: prefer provided resumeData, else cached or LLM parse
    let parsedResume: ResumeData;
    if (resumeData) {
      parsedResume = resumeData;
    } else {
      // Try to load cached parsedData
      // Try to load cached parsedData for this user
      const saved = await prisma.savedResume.findFirst({ where: { userId: dbUser.id, textHash: originalTextHash } });
      if (saved?.parsedData) {
        parsedResume = saved.parsedData as ResumeData;
      } else {
        const parseRes = await fetch(`${baseUrl}/api/parse-resume`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resume: resumeText, jobDescription }),
        });
        if (!parseRes.ok) throw new Error('parse-resume failed');
        parsedResume = (await parseRes.json()).parsedResume as ResumeData;
      }
    }

    // 1. Extract JD info via Pages API (baseUrl defined earlier)
    const jdRes = await fetch(`${baseUrl}/api/extract-jd-info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobDescription }),
    });
    if (!jdRes.ok) throw new Error('extract-jd-info failed');
    const { targetTitle, targetCompany, requirements } = (await jdRes.json()) as ExtractJDInfoResponse;
    // Extract skills/keywords separately
    const ekRes = await fetch(`${baseUrl}/api/extract-keywords`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobDescription }),
    });
    if (!ekRes.ok) throw new Error('extract-keywords failed');
    const { keywords } = (await ekRes.json()) as { keywords: string[] };

    // Deep-clone to preserve the original parsed resume before mutation
    const originalParsedResume: ResumeData = JSON.parse(JSON.stringify(parsedResume));
    // Work on a separate copy for updates
    const updated: ResumeData = JSON.parse(JSON.stringify(parsedResume));
    // Ensure certifications and awards from parsed resume persist into optimized version
    updated.certifications = parsedResume.certifications || [];
    updated.awards = parsedResume.awards || [];

    // 3. Map keywords via Pages API
    const mapRes = await fetch(`${baseUrl}/api/map-keywords`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeData: updated, keywords }),
    });
    if (!mapRes.ok) throw new Error('map-keywords failed');
    const { assignments } = (await mapRes.json()) as MapKeywordsResponse;

    // 4. Rewrite bullets in parallel with limited concurrency, avoiding duplicate start verbs
    const rewriteResults: BulletRewriteResult[] = [];
    // Track used leading verbs to avoid repetition
    const usedVerbs: string[] = [];
    // Prepare tasks for each bullet
    const tasks: { wi: number; bi: number; bullet: string; assignedKeywords: string[] }[] = [];
    updated.work.forEach((workItem, wi) => {
      workItem.bullets.forEach((bullet, bi) => {
        const assignment = assignments.find((a) => a.workIndex === wi && a.bulletIndex === bi);
        tasks.push({ wi, bi, bullet, assignedKeywords: assignment?.assignedKeywords || [] });
      });
    });
    const concurrency = 3;
    for (let i = 0; i < tasks.length; i += concurrency) {
      const batch = tasks.slice(i, i + concurrency);
      // Send rewrite requests, passing already used verbs
      const results = await Promise.all(
        batch.map(async ({ wi, bi, bullet, assignedKeywords }) => {
          const bulletRes = await fetch(`${baseUrl}/api/rewrite-bullet`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bullet,
              keywords: assignedKeywords,
              jobTitle: updated.work[wi].title,
              company: updated.work[wi].company,
              jobDescription,
              skills: updated.skills,
              targetTitle,
              targetCompany,
              requirements,
              usedVerbs,
            }),
          });
          if (!bulletRes.ok) throw new Error('rewrite-bullet failed');
          const { rewrittenBullet, keywordsUsed } = (await bulletRes.json()) as RewriteBulletResponse;
          return { wi, bi, rewrittenBullet, keywordsUsed };
        })
      );
      // Apply results and capture leading verbs
      results.forEach(({ wi, bi, rewrittenBullet, keywordsUsed }) => {
        updated.work[wi].bullets[bi] = rewrittenBullet;
        rewriteResults.push({ workIndex: wi, bulletIndex: bi, rewrittenBullet, keywordsUsed });
        // Extract first word as verb and track it
        const firstWord = rewrittenBullet.trim().split(/\s+/)[0].replace(/[^A-Za-z]/g, '');
        if (firstWord) usedVerbs.push(firstWord.toLowerCase());
      });
    }
    // 5. Rewrite projects if present
    if (updated.projects && updated.projects.length) {
      const projRes = await fetch(`${baseUrl}/api/rewrite-projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projects: updated.projects,
          keywords,
          requirements,
          targetTitle,
          targetCompany,
          jobDescription,
          skills: updated.skills,
          summary: updated.summary || parsedResume.summary,
        }),
      });
      if (!projRes.ok) throw new Error('rewrite-projects failed');
      const { rewrittenProjects } = await projRes.json() as { rewrittenProjects: typeof updated.projects };
      updated.projects = rewrittenProjects;
    }

    // 5. Rewrite summary
    // 5. Rewrite summary via Pages API
    // Build an experience snapshot for prompt context
    const companies = Array.from(new Set(parsedResume.work.map(w => w.company))).join(', ');
    const titles = Array.from(new Set(parsedResume.work.map(w => w.title))).join(', ');
    const parseYear = (s: string) => {
      const m = s.match(/\d{4}/);
      return m ? parseInt(m[0], 10) : null;
    };
    const endYears = parsedResume.work.map(w => parseYear(w.to || '') || new Date().getFullYear()).filter((y): y is number => !!y);
    const startYears = parsedResume.work.map(w => parseYear(w.from || '') || (endYears[0] || new Date().getFullYear())).filter((y): y is number => !!y);
    const yearsExp = endYears.length && startYears.length ? Math.max(...endYears) - Math.min(...startYears) : null;
    const experienceSnapshot = [
      yearsExp ? `${yearsExp}+ years of experience` : '',
      companies ? `across ${companies}` : '',
      titles ? `roles as ${titles}` : ''
    ].filter(Boolean).join(', ') + '.';
    const summaryRes = await fetch(`${baseUrl}/api/rewrite-summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        originalSummary: parsedResume.summary,
        optimizedBullets: updated.work.flatMap((w) => w.bullets),
        projects: updated.projects || [],
        skills: updated.skills,
        targetTitle,
        targetCompany,
        requirements,
        keywords,
        jobDescription,
        experienceSnapshot,
      }),
    });
    if (!summaryRes.ok) throw new Error('rewrite-summary failed');
    const { rewrittenSummary } = (await summaryRes.json()) as RewriteSummaryResponse;
    updated.summary = rewrittenSummary;

    // 6. Rewrite skills
    // 6. Rewrite skills via Pages API
    const skillsRes = await fetch(`${baseUrl}/api/rewrite-skills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        originalSkills: updated.skills,
        optimizedSummary: updated.summary,
        optimizedBullets: updated.work.flatMap((w) => w.bullets),
        keywords,
        targetTitle,
        targetCompany,
        requirements,
        jobDescription,
      }),
    });
    if (!skillsRes.ok) throw new Error('rewrite-skills failed');
    const { rewrittenSkills } = (await skillsRes.json()) as RewriteSkillsResponse;
    updated.skills = rewrittenSkills;

    // 7. Rewrite projects via Pages API (if present)
    if (parsedResume.projects && parsedResume.projects.length > 0) {
      const projRes = await fetch(`${baseUrl}/api/rewrite-projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projects: parsedResume.projects,
          keywords,
          requirements,
          targetTitle,
          targetCompany,
          jobDescription,
          skills: updated.skills,
          summary: updated.summary
        })
      });
      if (!projRes.ok) throw new Error('rewrite-projects failed');
      const { rewrittenProjects } = (await projRes.json()) as { rewrittenProjects: any[] };
      updated.projects = rewrittenProjects;
    }
    // Ensure certifications & awards flow through to optimized resume
    updated.certifications = parsedResume.certifications || [];
    updated.awards = parsedResume.awards || [];
    // 8. Persist optimization run
    const runData: OptimizationRunData = {
      // Link run to the correct DB user
      userId: dbUser.id,
      resumeFileId: resumeFile.id,
      jobDescription,
      templateId: String(templateId),
      originalText: JSON.stringify(originalParsedResume),
      optimizedText: JSON.stringify(updated),
      bulletRewrites: rewriteResults,
      summaryRewrite: updated.summary,
      skillsRewrite: JSON.stringify(updated.skills),
      keywords,
      requirements,
      targetTitle,
      targetCompany,
      aiModel: 'o3-mini-2025-01-31',
      tokenCount: 0,
      costUsd: 0,
    };
    // Persist optimization run, decrementing free run credit atomically for free users
    let run;
    if (has({ plan: 'free_user' })) {
      const [, newRun] = await prisma.$transaction([
        // Decrement free runs on the correct DB user
        prisma.user.update({
          where: { id: dbUser.id },
          data: { freeRunsRemaining: { decrement: 1 } }
        }),
        prisma.optimizationRun.create({ data: runData as any })
      ]);
      run = newRun;
    } else {
      run = await prisma.optimizationRun.create({ data: runData as any });
    }

    // Return full result (ATS scoring will be performed via a separate API)
    return NextResponse.json({
      runId: run.id,
      originalResume: originalParsedResume,
      optimizedResume: {
        ...updated,
        certifications: parsedResume.certifications || [],
        awards: parsedResume.awards || [],
      },
      keywords,
      requirements,
      targetTitle,
      targetCompany,
    });
  } catch (error: any) {
    console.error('Error in optimize-resume:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}