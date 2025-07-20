import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { headers } from 'next/headers';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const password = searchParams.get('password');

    // Find the share
    const share = await prisma.resumeShare.findUnique({
      where: { shareToken: params.token },
      include: {
        resume: {
          select: {
            id: true,
            title: true,
            builderData: true,
            template: true,
            createdAt: true,
            updatedAt: true,
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    if (!share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    // Check if share is expired
    if (share.expiresAt && new Date() > share.expiresAt) {
      return NextResponse.json({ error: 'Share link has expired' }, { status: 410 });
    }

    // Check password if required
    if (share.password && share.password !== password) {
      return NextResponse.json({ 
        error: 'Password required',
        requiresPassword: true 
      }, { status: 401 });
    }

    // Track view
    const headersList = headers();
    const userAgent = headersList.get('user-agent') || undefined;
    const referer = headersList.get('referer') || undefined;
    const forwardedFor = headersList.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0] : 
                     headersList.get('x-real-ip') || undefined;

    // Create view record and increment counter
    await Promise.all([
      prisma.shareView.create({
        data: {
          shareId: share.id,
          ipAddress,
          userAgent,
          referer
        }
      }),
      prisma.resumeShare.update({
        where: { id: share.id },
        data: {
          viewCount: { increment: 1 },
          lastViewed: new Date()
        }
      })
    ]);

    // Return resume data without sensitive information
    const resumeData = {
      id: share.resume.id,
      title: share.resume.title,
      builderData: share.resume.builderData,
      template: share.resume.template,
      createdAt: share.resume.createdAt,
      updatedAt: share.resume.updatedAt,
      author: {
        name: `${share.resume.user.firstName || ''} ${share.resume.user.lastName || ''}`.trim() || 'Anonymous'
      },
      shareInfo: {
        viewCount: share.viewCount + 1,
        createdAt: share.createdAt
      }
    };

    return NextResponse.json({
      success: true,
      data: resumeData
    });

  } catch (error) {
    console.error('Error fetching shared resume:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shared resume' },
      { status: 500 }
    );
  }
}

// Handle password verification for protected shares
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const body = await request.json();
    const { password } = body;

    const share = await prisma.resumeShare.findUnique({
      where: { shareToken: params.token },
      select: {
        password: true,
        expiresAt: true
      }
    });

    if (!share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    // Check if share is expired
    if (share.expiresAt && new Date() > share.expiresAt) {
      return NextResponse.json({ error: 'Share link has expired' }, { status: 410 });
    }

    // Verify password
    const isValidPassword = share.password === password;

    return NextResponse.json({
      success: true,
      data: {
        isValidPassword,
        message: isValidPassword ? 'Password correct' : 'Invalid password'
      }
    });

  } catch (error) {
    console.error('Error verifying password:', error);
    return NextResponse.json(
      { error: 'Password verification failed' },
      { status: 500 }
    );
  }
}