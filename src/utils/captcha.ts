// reCAPTCHA v3 verification utility

export async function verifyCaptcha(token: string): Promise<boolean> {
    try {
        const secretKey = process.env.RECAPTCHA_SECRET_KEY;

        if (!secretKey) {
            console.error('RECAPTCHA_SECRET_KEY not configured');
            return false;
        }

        const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `secret=${secretKey}&response=${token}`,
        });

        const data = await response.json();

        // reCAPTCHA v3 returns a score from 0.0 to 1.0
        // 1.0 is very likely a good interaction, 0.0 is very likely a bot
        // We'll use 0.5 as threshold (adjust as needed)
        return data.success && data.score >= 0.5;
    } catch (error) {
        console.error('CAPTCHA verification error:', error);
        return false;
    }
}

// Check if request is from Railway domain
export function isRailwayDomain(request: Request): boolean {
    const referer = request.headers.get('referer') || '';
    const origin = request.headers.get('origin') || '';

    // Block any railway.app domains
    const railwayPattern = /railway\.app/i;

    return railwayPattern.test(referer) || railwayPattern.test(origin);
}
