import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    // Find the shared resume
    const share = await prisma.resumeShare.findUnique({
      where: { shareToken: params.token },
      include: {
        resume: {
          select: {
            title: true,
            builderData: true,
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

    if (!share || !share.resume) {
      return new NextResponse('Resume not found', { status: 404 });
    }

    const resume = share.resume;
    const authorName = `${resume.user.firstName || ''} ${resume.user.lastName || ''}`.trim() || 'Professional';
    const sections = resume.builderData.sections || {};

    // Generate SVG for Open Graph image
    const svg = `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Background -->
      <rect width="1200" height="630" fill="url(#bg)"/>
      
      <!-- Content Area -->
      <rect x="60" y="60" width="1080" height="510" rx="20" fill="white" opacity="0.95"/>
      
      <!-- Header -->
      <text x="120" y="140" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#1f2937">
        ${resume.title}
      </text>
      
      <!-- Author -->
      <text x="120" y="190" font-family="Arial, sans-serif" font-size="24" fill="#6b7280">
        by ${authorName}
      </text>
      
      <!-- Stats -->
      <g transform="translate(120, 250)">
        <!-- ATS Score -->
        <rect x="0" y="0" width="200" height="80" rx="10" fill="#10b981" opacity="0.1"/>
        <text x="20" y="30" font-family="Arial, sans-serif" font-size="14" fill="#10b981" font-weight="bold">ATS OPTIMIZED</text>
        <text x="20" y="55" font-family="Arial, sans-serif" font-size="24" fill="#065f46" font-weight="bold">95% Score</text>
        
        <!-- Experience -->
        <rect x="220" y="0" width="200" height="80" rx="10" fill="#3b82f6" opacity="0.1"/>
        <text x="240" y="30" font-family="Arial, sans-serif" font-size="14" fill="#3b82f6" font-weight="bold">EXPERIENCE</text>
        <text x="240" y="55" font-family="Arial, sans-serif" font-size="24" fill="#1e40af" font-weight="bold">${(sections.experience || []).length} Roles</text>
        
        <!-- Skills -->
        <rect x="440" y="0" width="200" height="80" rx="10" fill="#f59e0b" opacity="0.1"/>
        <text x="460" y="30" font-family="Arial, sans-serif" font-size="14" fill="#f59e0b" font-weight="bold">SKILLS</text>
        <text x="460" y="55" font-family="Arial, sans-serif" font-size="24" fill="#92400e" font-weight="bold">${(sections.skills || []).length} Categories</text>
      </g>
      
      <!-- Features -->
      <g transform="translate(120, 380)">
        <text x="0" y="0" font-family="Arial, sans-serif" font-size="18" fill="#374151" font-weight="600">✨ AI-Powered Optimization</text>
        <text x="0" y="35" font-family="Arial, sans-serif" font-size="18" fill="#374151" font-weight="600">🎯 Keyword Analysis</text>
        <text x="0" y="70" font-family="Arial, sans-serif" font-size="18" fill="#374151" font-weight="600">📊 Performance Analytics</text>
        
        <text x="350" y="0" font-family="Arial, sans-serif" font-size="18" fill="#374151" font-weight="600">🚀 Modern Templates</text>
        <text x="350" y="35" font-family="Arial, sans-serif" font-size="18" fill="#374151" font-weight="600">📱 Mobile Optimized</text>
        <text x="350" y="70" font-family="Arial, sans-serif" font-size="18" fill="#374151" font-weight="600">🔗 Easy Sharing</text>
      </g>
      
      <!-- Branding -->
      <text x="120" y="520" font-family="Arial, sans-serif" font-size="24" fill="#3b82f6" font-weight="bold">ResumeCraft</text>
      <text x="120" y="550" font-family="Arial, sans-serif" font-size="16" fill="#6b7280">Professional Resume Builder</text>
    </svg>`;

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });

  } catch (error) {
    console.error('Error generating OG image:', error);
    return new NextResponse('Error generating image', { status: 500 });
  }
}