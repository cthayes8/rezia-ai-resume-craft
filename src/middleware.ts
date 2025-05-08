import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const publicPaths = ['/', '/sign-in', '/sign-up'];

const isPublic = (path: string) => {
  return publicPaths.some((x) =>
    new RegExp(`^${x}`).test(path)
  );
};

export const middleware = clerkMiddleware(
  // Handler receives auth() helper and the request
  async (auth, request) => {
    // Allow public paths
    if (isPublic(request.nextUrl.pathname)) {
      return NextResponse.next();
    }
    // Authenticate the request
    const authObj = await auth();
    const { userId, redirectToSignIn } = authObj;
    // If not signed in, redirect via Clerk
    if (!userId) {
      return redirectToSignIn();
    }
    return NextResponse.next();
  }
);

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};