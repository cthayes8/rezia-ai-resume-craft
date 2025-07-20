import { MetadataRoute } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://resumecraft.ai';

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1
    },
    {
      url: `${baseUrl}/templates`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.6
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3
    }
  ];

  try {
    // Public resume shares
    const publicShares = await prisma.resumeShare.findMany({
      where: {
        isPublic: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      select: {
        shareToken: true,
        updatedAt: true
      },
      take: 1000 // Limit to prevent oversized sitemaps
    });

    const sharePages = publicShares.map(share => ({
      url: `${baseUrl}/shared/${share.shareToken}`,
      lastModified: share.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.4
    }));

    // Template pages (if you have individual template pages)
    const templates = await prisma.resumeTemplate.findMany({
      where: { isActive: true },
      select: {
        id: true,
        updatedAt: true
      }
    });

    const templatePages = templates.map(template => ({
      url: `${baseUrl}/templates/${template.id}`,
      lastModified: template.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.5
    }));

    return [...staticPages, ...sharePages, ...templatePages];

  } catch (error) {
    console.error('Error generating sitemap:', error);
    return staticPages;
  }
}