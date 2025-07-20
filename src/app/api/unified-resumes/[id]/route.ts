import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const resume = await prisma.unifiedResume.findFirst({
      where: {
        id,
        userId
      },
      include: {
        analyses: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        shares: true
      }
    });

    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: resume
    });

  } catch (error) {
    console.error('Error fetching unified resume:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resume' },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const { title, template, builderData, optimizationData, sharingData } = body;

    // Verify ownership
    const existingResume = await prisma.unifiedResume.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!existingResume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    const updatedResume = await prisma.unifiedResume.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(template && { template }),
        ...(builderData && { builderData }),
        ...(optimizationData !== undefined && { optimizationData }),
        ...(sharingData !== undefined && { sharingData }),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedResume
    });

  } catch (error) {
    console.error('Error updating unified resume:', error);
    return NextResponse.json(
      { error: 'Failed to update resume' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;
    console.log('DELETE request - User ID:', userId, 'Resume ID:', id);
    
    if (!userId) {
      console.log('DELETE failed: No user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const existingResume = await prisma.unifiedResume.findFirst({
      where: {
        id,
        userId
      }
    });

    console.log('DELETE - Existing resume found:', !!existingResume);

    if (!existingResume) {
      console.log('DELETE failed: Resume not found or unauthorized');
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    console.log('DELETE - Attempting to delete resume:', id);
    await prisma.unifiedResume.delete({
      where: { id }
    });

    console.log('DELETE - Resume deleted successfully');
    return NextResponse.json({
      success: true,
      message: 'Resume deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting unified resume:', error);
    return NextResponse.json(
      { error: `Failed to delete resume: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}