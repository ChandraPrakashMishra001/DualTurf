import { NextResponse } from 'next/server'

export function middleware(request) {
  // Rewrite all public user traffic to the /coming-soon landing page
  const pathname = request.nextUrl.pathname
  
  if (pathname !== '/coming-soon' && !pathname.startsWith('/admin')) {
    return NextResponse.rewrite(new URL('/coming-soon', request.url))
  }
}

export const config = {
  // Match all paths except api routes, static files, and images
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|images|football.mp4).*)',
  ],
}
