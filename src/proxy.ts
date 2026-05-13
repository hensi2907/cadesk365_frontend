import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith('/api/') || pathname.startsWith('/files/')) {
    // Extract the host from the request headers
    const host = request.headers.get('host') || '127.0.0.1:3000';
    // The host might include the port (e.g., 192.168.1.150:3000)
    const hostname = host.split(':')[0];

    // Rewrite to the Frappe backend dynamically on port 8000
    const backendUrl = `http://${hostname}:8000${pathname}${search}`;

    return NextResponse.rewrite(new URL(backendUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/files/:path*'],
};
