import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Domain redirection: uclinks.vercel.app -> links.asprin.dev
    const hostname = request.headers.get('host') || '';
    if (hostname.includes('uclinks.vercel.app')) {
        const url = request.nextUrl.clone();
        url.hostname = 'links.asprin.dev';
        url.protocol = 'https:';
        url.port = ''; // Ensure standard port
        return NextResponse.redirect(url);
    }


    // Allow all other requests
    return NextResponse.next();
}

// Apply middleware to all routes
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
