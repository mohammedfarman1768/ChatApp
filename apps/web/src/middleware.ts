import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
];

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('accessToken')?.value;
  const { pathname } = request.nextUrl;

  // If the user has an access token and tries to access an auth page (like login), redirect to /
  if (accessToken && publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If the user doesn't have an access token and tries to access a protected page, redirect to /login
  // We'll treat all other routes as protected for now except root / if we want, but let's just protect everything under /dashboard for instance.
  // Actually, let's protect everything that isn't explicitly public.
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route)) || pathname === '/';
  
  if (!accessToken && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
