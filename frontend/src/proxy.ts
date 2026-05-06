import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = ['/', '/login', '/voices', '/pricing', '/activate'];
const staticFileRegex = /\.(ico|css|js|jpg|jpeg|png|gif|svg|webp|woff|woff2|ttf|eot|mp3|wav)$/i;

export default function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Skip static files and Next.js internals
  if (
    staticFileRegex.test(path) ||
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path.startsWith('/workers')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('access_token')?.value;
  const isAuthenticated = !!token;

  const isPublicRoute = publicRoutes.some(route => path === route || path.startsWith(route + '/'));

  // Redirect unauthenticated users to login
  if (!isPublicRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from login
  if (path === '/login' && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)']
};
