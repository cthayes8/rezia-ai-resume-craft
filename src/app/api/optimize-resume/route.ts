import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { createHash } from 'crypto';
import { StreamingTextResponse } from 'ai';
import { 
  ResumeData, 
  ExtractJDInfoResponse,
  ParseResumeResponse,
  MapKeywordsResponse,
  RewriteBulletResponse,
  RewriteSummaryResponse,
  RewriteSkillsResponse,
  OptimizationRunData,
  KeywordAssignment,
  BulletRewriteResult
} from '@/types/resume';
import fetch from 'node-fetch';

// Configure for Edge runtime
export const runtime = 'edge';

interface OptimizeResumeRequest {
  resumeText: string;
  jobDescription: string;
  templateId?: string;
  fileName?: string;
}

/**
 * API Route: Full orchestration of resume optimization with streaming progress updates
 */
export async function POST(req: Request) {
  try {
    const { resumeText, jobDescription, templateId, fileName } = await req.json() as OptimizeResumeRequest;

    if (!resumeText || !jobDescription) {
      return NextResponse.json(
        { error: 'Missing resumeText or jobDescription' },
        { status: 400 }
      );
    }

    // Create a stream for progress updates
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Start processing in the background
    processResume(resumeText, jobDescription, templateId, fileName, writer);

    // Return the stream immediately
    return new StreamingTextResponse(stream.readable);
  } catch (err: any) {
    console.error('Error in optimize-resume:', err);
    return NextResponse.json(
      { error: err.message || 'Internal error' },
      { status: 500 }
    );
  }
}

async function processResume(
  resumeText: string,
  jobDescription: string,
  templateId: string | undefined,
  fileName: string | undefined,
  writer: WritableStreamDefaultWriter
) {
  try {
    // Authenticate user
    const session = await auth();
    const userId = session.userId;
    if (!userId) {
      await writer.write(JSON.stringify({ error: 'Unauthorized' }) + '\n');
      await writer.close();
      return;
    }

    // Send initial status
    await writer.write(JSON.stringify({ 
      status: 'started',
      step: 'authenticating'
    }) + '\n');

    // Ensure user exists in our database
    const clerkClientInstance = await clerkClient();
    const clerkUser = await clerkClientInstance.users.getUser(userId);
    const email = clerkUser.emailAddresses[0]?.emailAddress || '';
    const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim();

    await prisma.user.upsert({
      where: { id: userId },
      create: { id: userId, email, fullName },
      update: { email, fullName },
    });

    // Compute hash for deduplication
    const originalTextHash = createHash('sha256').update(resumeText).digest('hex');

    // Persist resume file metadata
    const resumeFile = await prisma.resumeFile.create({
      data: {
        userId,
        fileName: fileName || '',
        filePath: '',
        originalTextHash,
      },
    });

    // Construct base URL for internal fetches
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const host = req.headers.get('host');
    const baseUrl = `${protocol}://${host}`;

    // 1. Extract JD info
    await writer.write(JSON.stringify({ 
      status: 'progress',
      step: 'extracting_jd_info'
    }) + '\n');

    const jdRes = await fetch(`${baseUrl}/api/extract-jd-info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobDescription }),
    });
    if (!jdRes.ok) throw new Error('extract-jd-info failed');
    const { keywords, targetTitle, targetCompany, requirements } = await jdRes.json() as ExtractJDInfoResponse;

    // 2. Parse resume
    await writer.write(JSON.stringify({ 
      status: 'progress',
      step: 'parsing_resume'
    }) + '\n');

    const parseRes = await fetch(`${baseUrl}/api/parse-resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume: resumeText, jobDescription }),
    });
    if (!parseRes.ok) throw new Error('parse-resume failed');
    const { parsedResume } = await parseRes.json() as ParseResumeResponse;
    const updated: ResumeData = parsedResume;

    // 3. Map keywords
    await writer.write(JSON.stringify({ 
      status: 'progress',
      step: 'mapping_keywords'
    }) + '\n');

    const mapRes = await fetch(`${baseUrl}/api/map-keywords`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeData: updated, keywords }),
    });
    if (!mapRes.ok) throw new Error('map-keywords failed');
    const { assignments } = await mapRes.json() as MapKeywordsResponse;

    // 4. Rewrite all bullets sequentially
    const rewriteResults: BulletRewriteResult[] = [];
    const usedVerbs: string[] = [];
    
    for (let wi = 0; wi < updated.work.length; wi++) {
      for (let bi = 0; bi < updated.work[wi].bullets.length; bi++) {
        await writer.write(JSON.stringify({ 
          status: 'progress',
          step: 'rewriting_bullet',
          data: { workIndex: wi, bulletIndex: bi }
        }) + '\n');

        const bullet = updated.work[wi].bullets[bi];
        const assignment = assignments.find((a: KeywordAssignment) => a.workIndex === wi && a.bulletIndex === bi);
        const assignedKeywords = assignment?.assignedKeywords || [];
        
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
        const { rewrittenBullet, keywordsUsed } = await bulletRes.json() as RewriteBulletResponse;
        const verb = rewrittenBullet.trim().split(/\s+/)[0];
        usedVerbs.push(verb);
        updated.work[wi].bullets[bi] = rewrittenBullet;
        rewriteResults.push({ workIndex: wi, bulletIndex: bi, rewrittenBullet, keywordsUsed });
      }
    }

    // 5. Rewrite summary
    await writer.write(JSON.stringify({ 
      status: 'progress',
      step: 'rewriting_summary'
    }) + '\n');

    const summaryRes = await fetch(`${baseUrl}/api/rewrite-summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        originalSummary: parsedResume.summary,
        optimizedBullets: updated.work.flatMap(w => w.bullets),
        skills: updated.skills,
        targetTitle,
        targetCompany,
        requirements,
        keywords,
        jobDescription,
      }),
    });
    if (summaryRes.ok) {
      const { rewrittenSummary } = await summaryRes.json() as RewriteSummaryResponse;
      updated.summary = rewrittenSummary;
    }

    // 6. Rewrite skills
    await writer.write(JSON.stringify({ 
      status: 'progress',
      step: 'rewriting_skills'
    }) + '\n');

    const skillsRes = await fetch(`${baseUrl}/api/rewrite-skills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        originalSkills: updated.skills,
        optimizedSummary: updated.summary,
        optimizedBullets: updated.work.flatMap(w => w.bullets),
        keywords,
        targetTitle,
        targetCompany,
        requirements,
        jobDescription,
      }),
    });
    if (skillsRes.ok) {
      const { rewrittenSkills } = await skillsRes.json() as RewriteSkillsResponse;
      updated.skills = rewrittenSkills;
    }

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

    const run = await prisma.optimizationRun.create({
      data: runData as any,
    });

    // Send final result
    await writer.write(JSON.stringify({ 
      status: 'complete',
      data: {
        runId: run.id,
        originalResume: parsedResume,
        optimizedResume: updated,
        keywords,
        requirements,
        targetTitle,
        targetCompany,
      }
    }) + '\n');

    await writer.close();
  } catch (error) {
    console.error('Error in processResume:', error);
    await writer.write(JSON.stringify({ 
      status: 'error',
      error: error.message || 'Internal error'
    }) + '\n');
    await writer.close();
  }
}