import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Check if request is from Railway domain
    const referer = request.headers.get('referer') || '';
    const origin = request.headers.get('origin') || '';

    // Block any railway.app domains
    const railwayPattern = /railway\.app/i;

    if (railwayPattern.test(referer) || railwayPattern.test(origin)) {
        // Return 403 Forbidden for Railway domains
        return new NextResponse(
            JSON.stringify({
                error: 'Access denied',
                message: 'Access from this domain is not allowed'
            }),
            {
                status: 403,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
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
