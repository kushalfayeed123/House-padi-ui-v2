import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Where each role belongs. The `user_role` cookie is written client-side by
// AuthContext whenever the profile loads, so this middleware can bounce a
// signed-in user away from the dashboard that isn't theirs before the page
// renders. A missing/unknown role falls through to the client-side AuthGuard,
// which is also what prompts anonymous visitors to sign in.
const ROLE_HOME: Record<string, string> = {
  owner: '/dashboard/landlord',
  renter: '/dashboard/renter',
};

export function middleware(request: NextRequest) {
  const role = request.cookies.get('user_role')?.value;
  const path = request.nextUrl.pathname;

  if (!role) {
    return NextResponse.next();
  }

  const isLandlordRoute = path.startsWith('/dashboard/landlord');
  const isRenterRoute = path.startsWith('/dashboard/renter');

  const wrongRole =
    (isLandlordRoute && role !== 'owner') ||
    (isRenterRoute && role !== 'renter');

  if (wrongRole) {
    return NextResponse.redirect(new URL(ROLE_HOME[role] ?? '/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/landlord/:path*', '/dashboard/renter/:path*'],
};