"use client";

import { useState } from "react";
import { encodeLink, encodeLinkV1, encodeLinkV2, encodeLinkV3 } from "@/utils/linkWrapper";
import { motion, AnimatePresence } from "framer-motion";
import { Link2, Copy, CheckCircle, ShieldCheck, Lock } from "lucide-react";

type Version = 'base' | 'v1' | 'v2' | 'v3' | 'v4';

const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
};

export default function ShortPage() {
    const [url, setUrl] = useState("");
    const [version, setVersion] = useState<Version>("base");
    const [generatedLink, setGeneratedLink] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;

        setLoading(true);
        setError("");
        setGeneratedLink("");
        setCopied(false);

        // Basic validation
        let targetUrl = url;
        if (!/^https?:\/\//i.test(targetUrl)) {
            targetUrl = "https://" + targetUrl;
        }

        // V4 uses server-side API with CAPTCHA
        if (version === 'v4') {
            try {
                // Load reCAPTCHA if not already loaded
                if (!(window as any).grecaptcha) {
                    const script = document.createElement('script');
                    script.src = `https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`;
                    document.head.appendChild(script);
                    await new Promise(resolve => script.onload = resolve);
                }

                // Execute reCAPTCHA
                const token = await (window as any).grecaptcha.execute(
                    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
                    { action: 'generate_link' }
                );

                // Call API
                const response = await fetch('/api/v4', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        url: targetUrl,
                        captchaToken: token,
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    setError(data.error || 'Failed to generate link');
                    setLoading(false);
                    return;
                }

                setGeneratedLink(data.link);
            } catch (err) {
                setError('Failed to generate link. Please try again.');
                console.error('V4 generation error:', err);
            } finally {
                setLoading(false);
            }
            return;
        }

        // For other versions, use client-side encoding
        let slug = "";
        let prefix = "";

        switch (version) {
            case 'v1':
                slug = encodeLinkV1(targetUrl);
                prefix = "v1/";
                break;
            case 'v2':
                slug = encodeLinkV2(targetUrl);
                prefix = "v2/";
                break;
            case 'v3':
                slug = encodeLinkV3(targetUrl);
                prefix = "v3/";
                break;
            default:
                slug = encodeLink(targetUrl);
                prefix = "";
        }

        // Use window.location.origin to get the current host
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        setGeneratedLink(`${origin}/${prefix}${slug}`);
        setLoading(false);
    };

    const copyToClipboard = () => {
        if (!generatedLink) return;
        navigator.clipboard.writeText(generatedLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <main className="relative min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden bg-black text-white selection:bg-purple-500/30">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[200px] h-[200px] md:w-[500px] md:h-[500px] rounded-full bg-purple-600/20 blur-[50px] md:blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[200px] h-[200px] md:w-[500px] md:h-[500px] rounded-full bg-blue-600/20 blur-[50px] md:blur-[100px]" />
                <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[800px] md:h-[800px] rounded-full bg-zinc-900/40 blur-[30px] md:blur-[50px] mix-blend-overlay" />
            </div>

            <motion.div
                initial="hidden"
                animate="visible"
                variants={variants}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="z-10 w-full max-w-2xl"
            >
                <div className="mb-8 text-center space-y-2">

                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                        Links.Asprin.Dev
                    </h1>
                    <p className="text-zinc-400 text-lg">
                        Premium link wrapping & protection service
                    </p>
                </div>

                <div className="relative group perspective-1000">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl opacity-20 blur group-hover:opacity-40 transition duration-1000"></div>
                    <div className="relative p-8 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
                        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                            {/* Version Selector */}
                            <div className="space-y-2">
                                <label htmlFor="version-select" className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                                    Security Level
                                </label>
                                <div className="relative">
                                    <select
                                        id="version-select"
                                        className="w-full p-4 pl-4 rounded-xl border border-white/10 bg-zinc-900/50 hover:bg-zinc-900/80 text-zinc-100 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 outline-none transition-all appearance-none cursor-pointer"
                                        value={version}
                                        onChange={(e) => setVersion(e.target.value as Version)}
                                    >
                                        <option value="base">v0 • Basic Encryption</option>
                                        <option value="v1">v1 • Enhanced Obfuscation</option>
                                        <option value="v2">v2 • Advanced Encoding</option>
                                        <option value="v3">v3 • Linkshortify Optimized</option>
                                        <option value="v4">v4 • CAPTCHA + High Security</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down w-4 h-4"><path d="m6 9 6 6 6-6" /></svg>
                                    </div>
                                </div>
                            </div>

                            {/* URL Input */}
                            <div className="space-y-2">
                                <label htmlFor="url-input" className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                                    Destination URL
                                </label>
                                <div className="relative group/input">
                                    <input
                                        id="url-input"
                                        type="text"
                                        placeholder={version === 'v3' ? 'https://lksfy.com/QDuafv' : 'https://example.com'}
                                        className="w-full p-4 pl-11 rounded-xl border border-white/10 bg-zinc-900/50 hover:bg-zinc-900/80 text-zinc-100 placeholder:text-zinc-600 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 outline-none transition-all"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        required
                                    />
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within/input:text-purple-400">
                                        <Link2 className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="relative w-full py-4 mt-2 bg-zinc-900 hover:bg-zinc-800 border border-white/10 disabled:bg-zinc-800 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg active:scale-[0.99]"
                            >
                                <span className="flex items-center justify-center gap-2">
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="w-4 h-4" />
                                            Secure & Generate Link
                                        </>
                                    )}
                                </span>
                            </button>

                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                                    >
                                        <p className="text-sm text-red-400 text-center">{error}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </form>

                        <AnimatePresence>
                            {generatedLink && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="mt-8 pt-6 border-t border-white/10"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-xs uppercase tracking-wider text-purple-400 font-bold flex items-center gap-2">
                                            <ShieldCheck className="w-3 h-3" />
                                            Secure Link Generated
                                        </p>
                                        {copied && (
                                            <motion.span
                                                initial={{ opacity: 0, x: 10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="text-xs text-green-400 flex items-center gap-1"
                                            >
                                                <CheckCircle className="w-3 h-3" />
                                                Copied!
                                            </motion.span>
                                        )}
                                    </div>
                                    <div
                                        onClick={copyToClipboard}
                                        className="group cursor-pointer relative p-4 rounded-xl bg-zinc-900/80 border border-white/10 hover:border-purple-500/30 transition-all"
                                    >
                                        <p className="break-all text-zinc-300 font-mono text-sm pr-8 group-hover:text-white transition-colors">
                                            {generatedLink}
                                        </p>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-white/5 group-hover:bg-purple-500/20 text-zinc-400 group-hover:text-purple-300 transition-all">
                                            {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-12 text-center"
                >
                    <p className="text-sm text-zinc-500">
                        Crafted by{' '}
                        <a
                            href="https://t.me/happySaturday_bitch"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-400 hover:text-white transition-colors underline decoration-zinc-700 hover:decoration-white underline-offset-4"
                        >
                            asprin dev
                        </a>
                    </p>
                    <p className="text-xs text-zinc-600 mt-2">
                        @happySaturday_bitch for paid projects
                    </p>
                </motion.div>
            </motion.div>
        </main>
    );
}
