import { NextResponse } from 'next/server'

export function middleware(request) {
  // Rewrite all traffic to /coming-soon page
  if (request.nextUrl.pathname !== '/coming-soon') {
    return NextResponse.rewrite(new URL('/coming-soon', request.url))
  }
}

export const config = {
  // Match all paths except api routes, static files, and images
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
  ],
}
