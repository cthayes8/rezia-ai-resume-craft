import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/resume(.*)',
  '/api/unified-resumes(.*)',
  '/api/parse-resume(.*)',
  '/api/optimize-resume(.*)',
  '/api/advanced-analysis(.*)',
  '/api/ai-rewrite(.*)',
  '/api/ats-score(.*)',
  '/api/extract-keywords(.*)',
  '/api/generate-improvements(.*)',
  '/api/me(.*)',
  '/api/stripe(.*)',
  '/api/billing-portal(.*)',
  '/choose-plan(.*)'
]);

export const middleware = clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) {
    auth().protect();
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};