import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const role = request.cookies.get('user_role')?.value; // Assume you set this on login
  const path = request.nextUrl.pathname;

  console.log(path)

  // Protect Landlord Routes
  if (path.includes('/landlord') && role === 'landlord') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Protect Renter Routes
  if (path.includes('/renter') && role === 'renter') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/landlord/:path*', '/renter/:path*'],
};