import { NextResponse } from 'next/server';

export function middleware(request) {
  // Public paths that don't require auth
  const publicPaths = ['/login', '/register', '/api/auth/login', '/api/auth/register'];
  const { pathname } = request.nextUrl;

  if (publicPaths.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // For API routes check authorization header
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*']
};
