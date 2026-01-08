import { NextRequest, NextResponse } from 'next/server';
import { encodeLinkV4 } from '@/utils/linkWrapper';
import { verifyCaptcha, isRailwayDomain } from '@/utils/captcha';

export async function POST(request: NextRequest) {
    try {
        // Block Railway domains
        if (isRailwayDomain(request)) {
            return NextResponse.json(
                { error: 'Access denied from this domain' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { url, captchaToken } = body;

        // Validate inputs
        if (!url || !captchaToken) {
            return NextResponse.json(
                { error: 'URL and CAPTCHA token are required' },
                { status: 400 }
            );
        }

        // Verify CAPTCHA
        const isCaptchaValid = await verifyCaptcha(captchaToken);
        if (!isCaptchaValid) {
            return NextResponse.json(
                { error: 'CAPTCHA verification failed. Please try again.' },
                { status: 403 }
            );
        }

        // Validate URL format
        let targetUrl = url;
        if (!/^https?:\/\//i.test(targetUrl)) {
            targetUrl = 'https://' + targetUrl;
        }

        // Generate V4 encoded link
        const slug = encodeLinkV4(targetUrl);

        if (!slug) {
            return NextResponse.json(
                { error: 'Failed to encode URL' },
                { status: 500 }
            );
        }

        // Return the generated link
        const origin = request.headers.get('origin') || '';
        const generatedLink = `${origin}/v4/${slug}`;

        return NextResponse.json({
            success: true,
            link: generatedLink,
            slug: slug,
        });

    } catch (error) {
        console.error('V4 API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
