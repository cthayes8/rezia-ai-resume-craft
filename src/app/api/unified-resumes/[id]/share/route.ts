import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { isPublic = true, password, expiresAt } = body;

    // Verify resume ownership
    const resume = await prisma.unifiedResume.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    // Generate unique share token
    const shareToken = crypto.randomBytes(16).toString('hex');

    // Create share record
    const share = await prisma.resumeShare.create({
      data: {
        resumeId: resume.id,
        shareToken,
        isPublic,
        password: password || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      }
    });

    // Update resume published timestamp if making public
    if (isPublic) {
      await prisma.unifiedResume.update({
        where: { id: resume.id },
        data: { publishedAt: new Date() }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        shareToken,
        shareUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/shared/${shareToken}`,
        isPublic,
        expiresAt: share.expiresAt
      }
    });

  } catch (error) {
    console.error('Error creating resume share:', error);
    return NextResponse.json(
      { error: 'Failed to create share link' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all shares for this resume
    const shares = await prisma.resumeShare.findMany({
      where: {
        resume: {
          id: params.id,
          userId
        }
      },
      include: {
        views: {
          select: {
            viewedAt: true,
            country: true,
            referer: true
          },
          orderBy: { viewedAt: 'desc' },
          take: 10
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: shares
    });

  } catch (error) {
    console.error('Error fetching resume shares:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shares' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const shareToken = searchParams.get('token');

    if (!shareToken) {
      return NextResponse.json(
        { error: 'Share token is required' },
        { status: 400 }
      );
    }

    // Verify ownership and delete share
    const share = await prisma.resumeShare.findFirst({
      where: {
        shareToken,
        resume: {
          id: params.id,
          userId
        }
      }
    });

    if (!share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    await prisma.resumeShare.delete({
      where: { id: share.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Share link deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting resume share:', error);
    return NextResponse.json(
      { error: 'Failed to delete share link' },
      { status: 500 }
    );
  }
}