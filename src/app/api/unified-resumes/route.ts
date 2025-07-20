import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const resumes = await prisma.unifiedResume.findMany({
      where: { userId },
      include: {
        analyses: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        },
        shares: {
          where: { isPublic: true },
          select: { shareToken: true, viewCount: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset
    });

    const total = await prisma.unifiedResume.count({
      where: { userId }
    });

    return NextResponse.json({
      success: true,
      data: {
        resumes,
        pagination: {
          total,
          limit,
          offset,
          hasMore: total > offset + limit
        }
      }
    });

  } catch (error) {
    console.error('Error fetching unified resumes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resumes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, template, builderData, optimizationData, sharingData } = body;

    if (!title || !builderData) {
      return NextResponse.json(
        { error: 'Title and builder data are required' },
        { status: 400 }
      );
    }

    const resume = await prisma.unifiedResume.create({
      data: {
        userId,
        title,
        template: template || 'modern',
        builderData,
        optimizationData: optimizationData || null,
        sharingData: sharingData || null
      }
    });

    return NextResponse.json({
      success: true,
      data: resume
    });

  } catch (error) {
    console.error('Error creating unified resume:', error);
    return NextResponse.json(
      { error: 'Failed to create resume' },
      { status: 500 }
    );
  }
}