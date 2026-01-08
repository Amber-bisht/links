"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function V4RedirectPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;

    const [status, setStatus] = useState<'loading' | 'verifying' | 'redirecting' | 'error'>('loading');
    const [error, setError] = useState('');

    useEffect(() => {
        const verifyAndRedirect = async () => {
            try {
                setStatus('loading');

                // Check if CAPTCHA is configured
                const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

                if (!siteKey) {
                    console.warn('⚠️ CAPTCHA not configured - using development mode');
                    // Development mode: directly call API with bypass token
                    const response = await fetch('/api/v4/redirect', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            slug: slug,
                            captchaToken: 'development-bypass',
                        }),
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        setError(data.error || 'Failed to verify. Please try again.');
                        setStatus('error');
                        return;
                    }

                    setStatus('redirecting');
                    window.location.href = data.url;
                    return;
                }

                // Production mode: Load and execute reCAPTCHA
                setStatus('verifying');

                // Load reCAPTCHA script if not already loaded
                if (!(window as any).grecaptcha) {
                    const script = document.createElement('script');
                    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;

                    // Handle script loading errors
                    script.onerror = () => {
                        console.error('Failed to load reCAPTCHA script');
                        setError('Failed to load security verification. Please check your connection.');
                        setStatus('error');
                    };

                    document.head.appendChild(script);

                    // Wait for script to load
                    await new Promise((resolve, reject) => {
                        script.onload = resolve;
                        script.onerror = reject;
                    });

                    // Wait for grecaptcha to be ready
                    await new Promise<void>(resolve => {
                        const checkReady = setInterval(() => {
                            if ((window as any).grecaptcha?.ready) {
                                clearInterval(checkReady);
                                (window as any).grecaptcha.ready(() => resolve());
                            }
                        }, 100);

                        // Timeout after 10 seconds
                        setTimeout(() => {
                            clearInterval(checkReady);
                            resolve();
                        }, 10000);
                    });
                }

                // Execute reCAPTCHA
                const token = await (window as any).grecaptcha.execute(siteKey, { action: 'redirect' });

                // Call API to verify CAPTCHA and get redirect URL
                const response = await fetch('/api/v4/redirect', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        slug: slug,
                        captchaToken: token,
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    setError(data.error || 'Failed to verify. Please try again.');
                    setStatus('error');
                    return;
                }

                // Redirect to the decoded URL
                setStatus('redirecting');
                window.location.href = data.url;

            } catch (err: any) {
                console.error('Redirect error:', err);
                setError(err.message || 'An error occurred. Please try again.');
                setStatus('error');
            }
        };

        if (slug) {
            verifyAndRedirect();
        }
    }, [slug, router]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-zinc-900">
            <div className="max-w-md w-full p-8 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-700">
                {status === 'loading' && (
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                            Loading...
                        </h2>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            Preparing secure redirect
                        </p>
                    </div>
                )}

                {status === 'verifying' && (
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                            Verifying...
                        </h2>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            Checking security verification
                        </p>
                    </div>
                )}

                {status === 'redirecting' && (
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                            Redirecting...
                        </h2>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            Taking you to your destination
                        </p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="text-center">
                        <div className="text-red-500 text-5xl mb-4">⚠️</div>
                        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                            Verification Failed
                        </h2>
                        <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                            {error}
                        </p>
                        <button
                            onClick={() => router.push('/')}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                            Go to Home
                        </button>
                    </div>
                )}

                <div className="mt-6 text-center">
                    <p className="text-xs text-zinc-500 dark:text-zinc-500">
                        Protected by reCAPTCHA v3
                    </p>
                </div>
            </div>
        </div>
    );
}
