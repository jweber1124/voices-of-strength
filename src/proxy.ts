import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'vos_manager';

export function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // The login page itself must stay reachable to unauthenticated users.
  if (path === '/manager/login') {
    return NextResponse.next();
  }

  const authed = req.cookies.get(COOKIE_NAME)?.value === '1';
  if (!authed) {
    const url = req.nextUrl.clone();
    url.pathname = '/manager/login';
    if (path !== '/manager') {
      url.searchParams.set('next', path);
    }
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/manager/:path*'],
};
