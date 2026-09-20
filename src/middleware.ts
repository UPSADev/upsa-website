import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher(['/admin(.*)']);
const isPublicPortalRoute = createRouteMatcher(['/portal', '/portal/sign-in(.*)', '/portal/sign-up(.*)']);
const isPortalRoute = createRouteMatcher(['/portal(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  if (isPortalRoute(req) && !isPublicPortalRoute(req)) {
    await auth.protect({ unauthenticatedUrl: new URL('/portal/sign-in', req.url).toString() });
  }
});

export const config = {
  matcher: ['/((?!_next|.*\\..*|favicon.ico).*)'],
};
