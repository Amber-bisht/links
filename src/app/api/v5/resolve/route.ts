import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Session from '@/models/Session';
import { verifyCaptcha } from '@/utils/captcha';

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { token, captchaToken } = await req.json();

        if (!token) {
            return NextResponse.json({ error: 'Missing token' }, { status: 400 });
        }

        // 0. Verify CAPTCHA
        if (!captchaToken && process.env.NODE_ENV === 'production') {
            return NextResponse.json({ error: 'Security verification required' }, { status: 400 });
        }

        if (captchaToken) {
            const isCaptchaValid = await verifyCaptcha(captchaToken);
            if (!isCaptchaValid) {
                return NextResponse.json({ error: 'Security verification failed' }, { status: 403 });
            }
        }

        // 1. Find Session
        const session = await Session.findOne({ token });

        if (!session) {
            return NextResponse.json({ error: 'Link expired or invalid' }, { status: 404 });
        }

        // 2. Check Anti-Replay
        if (session.used) {
            return NextResponse.json({ error: 'Link already used' }, { status: 410 });
        }

        // 3. Verify IP Pinning
        const forwarded = req.headers.get('x-forwarded-for');
        const currentIp = forwarded ? forwarded.split(',')[0] : '127.0.0.1';

        if (session.ipAddress !== currentIp) {
            console.warn(`[V5 Security Check] IP Mismatch for token ${token}. Expected ${session.ipAddress}, got ${currentIp}`);

            // Allow mismatch in development for easier testing
            if (process.env.NODE_ENV === 'production') {
                return NextResponse.json({
                    error: 'Security Check Failed: IP Mismatch. Please regenerate the link and don\'t use proxies or extractors.',
                    code: 'IP_MISMATCH'
                }, { status: 403 });
            }
        }

        // 4. Verify Time Threshold (35s)
        const now = new Date();
        const elapsedSeconds = (now.getTime() - new Date(session.createdAt).getTime()) / 1000;

        if (elapsedSeconds < 35) {
            console.warn(`[V5 Security Check] Time bypass attempt. Token: ${token}, Elapsed: ${elapsedSeconds.toFixed(1)}s`);
            if (process.env.NODE_ENV === 'production') {
                return NextResponse.json({
                    error: `Security Check Failed: Request too fast. Please wait at least 35 seconds while completing the ad links.`,
                    code: 'TOO_FAST'
                }, { status: 403 });
            }
        }

        // 5. Verify Referer (Strict Whitelist)
        const referer = req.headers.get('referer');
        const allowedReferers = ['linkshortify.com', 'lksfy.com'];

        const isWhitelisted = referer && allowedReferers.some(domain => referer.includes(domain));

        if (process.env.NODE_ENV === 'production' && !isWhitelisted) {
            console.warn(`[V5 Security Check] Invalid Referer: ${referer}. Strictly requiring LinkShortify transit.`);
            return NextResponse.json({
                error: 'Security Check Failed: You must come directly from the advertisement link. Extractors are not permitted.',
                code: 'INVALID_REFERER'
            }, { status: 403 });
        }

        // 6. Verify Browser Locking Cookie
        const sidCookie = req.headers.get('cookie')?.split('; ').find(row => row.startsWith('v5_sid='))?.split('=')[1];
        if (process.env.NODE_ENV === 'production' && sidCookie !== token) {
            console.warn(`[V5 Security Check] Cookie Mismatch or Missing for token ${token}. Sid: ${sidCookie}`);
            return NextResponse.json({
                error: 'Security Check Failed: Browser mismatch. Please complete the process in the same browser where you generated the link.',
                code: 'BROWSER_MISMATCH'
            }, { status: 403 });
        }

        // 7. Mark as Used
        session.used = true;
        await session.save();

        // 5. Return Target URL
        return NextResponse.json({
            success: true,
            url: session.targetUrl
        });

    } catch (error) {
        console.error('V5 Resolve Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
