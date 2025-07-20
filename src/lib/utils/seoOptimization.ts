// SEO optimization utilities for the resume platform

export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  structured?: any;
}

export class SEOOptimizer {
  private static baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://resumecraft.ai';

  static generateResumeMetadata(resume: any, shareToken?: string): SEOMetadata {
    const title = `${resume.title || 'Professional Resume'} - ResumeCraft`;
    const description = `Professional resume for ${resume.builderData?.sections?.basics?.name || 'career professional'}. Built with advanced ATS optimization and modern design templates.`;
    
    const keywords = [
      'resume',
      'CV',
      'professional resume',
      'ATS optimized',
      'career',
      'job application',
      ...(resume.builderData?.sections?.skills?.flatMap((s: any) => s.keywords || []) || [])
    ];

    const metadata: SEOMetadata = {
      title,
      description,
      keywords,
      ogType: 'profile',
      twitterCard: 'summary_large_image'
    };

    if (shareToken) {
      metadata.canonical = `${this.baseUrl}/shared/${shareToken}`;
      metadata.ogImage = `${this.baseUrl}/api/og/resume/${shareToken}`;
    }

    return metadata;
  }

  static generateLandingMetadata(): SEOMetadata {
    return {
      title: 'ResumeCraft - AI-Powered Resume Builder & ATS Optimizer',
      description: 'Create professional, ATS-optimized resumes with our AI-powered builder. Advanced keyword analysis, real-time optimization, and beautiful templates.',
      keywords: [
        'resume builder',
        'ATS optimization',
        'AI resume',
        'professional resume',
        'CV builder',
        'job application',
        'career tools',
        'resume templates'
      ],
      canonical: this.baseUrl,
      ogType: 'website',
      ogImage: `${this.baseUrl}/api/og/landing`,
      twitterCard: 'summary_large_image',
      structured: {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'ResumeCraft',
        description: 'AI-powered resume builder with ATS optimization',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD'
        }
      }
    };
  }

  static generateAnalyticsMetadata(): SEOMetadata {
    return {
      title: 'Resume Analytics Dashboard - ResumeCraft',
      description: 'Comprehensive analytics for your resume performance. Track views, ATS scores, and optimization insights.',
      keywords: [
        'resume analytics',
        'ATS score',
        'resume performance',
        'job application tracking',
        'career insights'
      ],
      canonical: `${this.baseUrl}/analytics`,
      ogType: 'website'
    };
  }

  static generateBlogMetadata(post: any): SEOMetadata {
    return {
      title: `${post.title} - ResumeCraft Blog`,
      description: post.excerpt || post.description,
      keywords: post.tags || [],
      canonical: `${this.baseUrl}/blog/${post.slug}`,
      ogType: 'article',
      ogImage: post.image || `${this.baseUrl}/api/og/blog/${post.slug}`,
      twitterCard: 'summary_large_image',
      structured: {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.excerpt,
        author: {
          '@type': 'Organization',
          name: 'ResumeCraft'
        },
        publisher: {
          '@type': 'Organization',
          name: 'ResumeCraft'
        },
        datePublished: post.publishedAt,
        dateModified: post.updatedAt
      }
    };
  }

  static generateSitemapUrls(): string[] {
    const staticUrls = [
      '/',
      '/dashboard',
      '/templates',
      '/pricing',
      '/blog',
      '/about',
      '/privacy',
      '/terms'
    ];

    return staticUrls.map(url => `${this.baseUrl}${url}`);
  }

  static generateRobotsTxt(): string {
    return `
User-agent: *
Allow: /
Disallow: /dashboard/
Disallow: /api/
Disallow: /shared/*?password=*

# Sitemap
Sitemap: ${this.baseUrl}/sitemap.xml

# Crawl delay
Crawl-delay: 1
`.trim();
  }

  static generateManifest() {
    return {
      name: 'ResumeCraft - AI Resume Builder',
      short_name: 'ResumeCraft',
      description: 'Create professional, ATS-optimized resumes with AI',
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#3b82f6',
      icons: [
        {
          src: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    };
  }
}

// Head component helper
export function generateHeadTags(metadata: SEOMetadata): React.ReactElement {
  return React.createElement('head', {}, [
    React.createElement('title', { key: 'title' }, metadata.title),
    React.createElement('meta', { 
      key: 'description', 
      name: 'description', 
      content: metadata.description 
    }),
    React.createElement('meta', { 
      key: 'keywords', 
      name: 'keywords', 
      content: metadata.keywords.join(', ') 
    }),
    metadata.canonical && React.createElement('link', { 
      key: 'canonical', 
      rel: 'canonical', 
      href: metadata.canonical 
    }),
    React.createElement('meta', { 
      key: 'og:title', 
      property: 'og:title', 
      content: metadata.title 
    }),
    React.createElement('meta', { 
      key: 'og:description', 
      property: 'og:description', 
      content: metadata.description 
    }),
    metadata.ogType && React.createElement('meta', { 
      key: 'og:type', 
      property: 'og:type', 
      content: metadata.ogType 
    }),
    metadata.ogImage && React.createElement('meta', { 
      key: 'og:image', 
      property: 'og:image', 
      content: metadata.ogImage 
    }),
    metadata.twitterCard && React.createElement('meta', { 
      key: 'twitter:card', 
      name: 'twitter:card', 
      content: metadata.twitterCard 
    }),
    metadata.structured && React.createElement('script', {
      key: 'structured',
      type: 'application/ld+json',
      dangerouslySetInnerHTML: { __html: JSON.stringify(metadata.structured) }
    })
  ].filter(Boolean));
}

// Core Web Vitals optimization
export function optimizeWebVitals() {
  if (typeof window === 'undefined') return;

  // Preload critical resources
  const preloadCriticalResources = () => {
    const criticalFonts = [
      '/fonts/inter-var.woff2'
    ];

    criticalFonts.forEach(font => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = font;
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  };

  // Optimize images
  const optimizeImages = () => {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src!;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  };

  // Defer non-critical JavaScript
  const deferNonCriticalJS = () => {
    const scripts = document.querySelectorAll('script[data-defer]');
    scripts.forEach(script => {
      const newScript = document.createElement('script');
      newScript.src = script.getAttribute('data-defer')!;
      newScript.defer = true;
      document.body.appendChild(newScript);
    });
  };

  // Initialize optimizations
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      preloadCriticalResources();
      optimizeImages();
      deferNonCriticalJS();
    });
  } else {
    preloadCriticalResources();
    optimizeImages();
    deferNonCriticalJS();
  }
}

import React from 'react';