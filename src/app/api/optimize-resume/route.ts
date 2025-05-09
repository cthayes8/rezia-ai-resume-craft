import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { createHash } from 'crypto';

import type { ResumeData, ExtractJDInfoResponse, ParseResumeResponse, MapKeywordsResponse, RewriteBulletResponse, RewriteSummaryResponse, RewriteSkillsResponse, OptimizationRunData, BulletRewriteResult } from '@/types/resume';
// heavy parsing steps moved to Pages API for faster warm lambdas
// Removed direct import of internal API handlers; using HTTP fetch to Pages API instead

export const runtime = 'nodejs';

interface OptimizeResumeRequest {
  resumeText: string;
  jobDescription: string;
  templateId?: string;
  fileName?: string;
}

/**
 * API Route: Full orchestration of resume optimization as a single Node.js function
 */
export async function POST(req: Request) {
  try {
    const { resumeText, jobDescription, templateId, fileName } = (await req.json()) as OptimizeResumeRequest;
    if (!resumeText || !jobDescription) {
      return NextResponse.json({ error: 'Missing resumeText or jobDescription' }, { status: 400 });
    }

    // Authenticate user
    const session = await auth();
    const userId = session.userId;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure user record
    const clerkUser = await (await clerkClient()).users.getUser(userId);
    const email = clerkUser.emailAddresses[0]?.emailAddress || '';
    const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim();
    await prisma.user.upsert({
      where: { id: userId },
      create: { id: userId, email, fullName },
      update: { email, fullName },
    });

    // Save resume file metadata
    const originalTextHash = createHash('sha256').update(resumeText).digest('hex');
    const resumeFile = await prisma.resumeFile.create({
      data: { userId, fileName: fileName || '', filePath: '', originalTextHash },
    });

    // Construct base URL for Pages API fetches
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const host = req.headers.get('host');
    const baseUrl = `${protocol}://${host}`;
    // 1. Extract JD info via Pages API
    const jdRes = await fetch(`${baseUrl}/api/extract-jd-info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobDescription }),
    });
    if (!jdRes.ok) throw new Error('extract-jd-info failed');
    const { keywords, targetTitle, targetCompany, requirements } = (await jdRes.json()) as ExtractJDInfoResponse;

    // 2. Parse resume via Pages API (with caching)
    const parseRes = await fetch(`${baseUrl}/api/parse-resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume: resumeText, jobDescription }),
    });
    if (!parseRes.ok) throw new Error('parse-resume failed');
    const { parsedResume } = (await parseRes.json()) as ParseResumeResponse;
    let updated: ResumeData = parsedResume;

    // 3. Map keywords via Pages API
    const mapRes = await fetch(`${baseUrl}/api/map-keywords`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeData: updated, keywords }),
    });
    if (!mapRes.ok) throw new Error('map-keywords failed');
    const { assignments } = (await mapRes.json()) as MapKeywordsResponse;

    // 4. Rewrite bullets in parallel with limited concurrency
    const rewriteResults: BulletRewriteResult[] = [];
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
      const results = await Promise.all(
        batch.map(async ({ wi, bi, bullet, assignedKeywords }) => {
          // Rewrite bullet via Pages API
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
              usedVerbs: [],
            }),
          });
          if (!bulletRes.ok) throw new Error('rewrite-bullet failed');
          const { rewrittenBullet, keywordsUsed } = (await bulletRes.json()) as RewriteBulletResponse;
          return { wi, bi, rewrittenBullet, keywordsUsed };
        })
      );
      // Apply results
      results.forEach(({ wi, bi, rewrittenBullet, keywordsUsed }) => {
        updated.work[wi].bullets[bi] = rewrittenBullet;
        rewriteResults.push({ workIndex: wi, bulletIndex: bi, rewrittenBullet, keywordsUsed });
      });
    }

    // 5. Rewrite summary
    // 5. Rewrite summary via Pages API
    const summaryRes = await fetch(`${baseUrl}/api/rewrite-summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        originalSummary: parsedResume.summary,
        optimizedBullets: updated.work.flatMap((w) => w.bullets),
        skills: updated.skills,
        targetTitle,
        targetCompany,
        requirements,
        keywords,
        jobDescription,
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

    // Persist optimization run
    const runData: OptimizationRunData = {
      userId,
      resumeFileId: resumeFile.id,
      jobDescription,
      templateId: String(templateId),
      originalText: JSON.stringify(parsedResume),
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
    const run = await prisma.optimizationRun.create({ data: runData as any });

    // Return full result
    return NextResponse.json({
      runId: run.id,
      originalResume: parsedResume,
      optimizedResume: updated,
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