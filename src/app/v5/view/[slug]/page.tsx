"use client";

import { useEffect, useState, use } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Loader2, AlertCircle } from 'lucide-react';

export default function ViewPage({ params }: { params: Promise<{ slug: string }> }) {
    // Unwrap params using React.use()
    const { slug } = use(params);

    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState('');

    // We only fetch status to check if it exists/validity, but the real check happens on POST
    useEffect(() => {
        // Just verify the slug exists or show error early
        setLoading(true);
        fetch(`/api/v5/link/get?slug=${slug}`)
            .then(res => res.json())
            .then(data => {
                // If it fails (e.g. 404), show error. If success, we just stop loading.
                if (!data.success) {
                    setError(data.error);
                }
                setLoading(false);
            })
            .catch(() => {
                setError('Failed to load link');
                setLoading(false);
            });
    }, [slug]);

    const handleVerify = async () => {
        setVerifying(true);
        setError('');

        try {
            // 0. Load and execute reCAPTCHA
            if (!(window as any).grecaptcha) {
                const script = document.createElement('script');
                script.src = `https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`;
                document.head.appendChild(script);
                await new Promise(resolve => script.onload = resolve);
            }

            // Wait for grecaptcha to be ready
            await new Promise<void>((resolve) => {
                (window as any).grecaptcha.ready(() => resolve());
            });

            const token = await (window as any).grecaptcha.execute(
                process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
                { action: 'v5_verify' }
            );

            // 1. Generate Session Token & Short Link using ONLY SLUG & Token
            const res = await fetch('/api/v5/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug, captchaToken: token }),
            });

            const data = await res.json();

            if (data.success && data.shortenedUrl) {
                // 2. Redirect User to the External Shortener
                window.location.href = data.shortenedUrl;
            } else {
                throw new Error(data.error || 'Verification failed');
            }

        } catch (err: any) {
            setError(err.message || 'Something went wrong');
            setVerifying(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <div className="bg-neutral-900 border border-red-900/50 p-6 rounded-2xl max-w-md w-full text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Link Unavailable</h2>
                    <p className="text-neutral-400">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-8 text-center space-y-8 shadow-2xl"
            >
                <div className="space-y-2">
                    <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto text-blue-500">
                        <ShieldCheck className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tighter">Human Verification</h1>
                    <p className="text-neutral-400 text-sm">
                        Please complete the security check to access the destination.
                    </p>
                </div>

                {/* Placeholder for Google Captcha V3 / Turnstile */}
                <div className="p-6 bg-neutral-950 rounded-xl border border-neutral-800">
                    <p className="text-xs text-neutral-500 mb-4 uppercase tracking-widest font-semibold">Security Check</p>

                    <button
                        onClick={handleVerify}
                        disabled={verifying}
                        className="w-full py-4 bg-white text-black font-bold rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                    >
                        {verifying ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" /> Verifying...
                            </>
                        ) : (
                            "I am not a robot"
                        )}
                    </button>
                </div>

                <p className="text-xs text-neutral-600">
                    Protected by SecureFlow V5 &copy; 2026
                </p>
            </motion.div>
        </div>
    );
}
