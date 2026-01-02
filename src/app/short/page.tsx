"use client";

import { useState } from "react";
import { encodeLink } from "@/utils/linkWrapper";

export default function ShortPage() {
    const [url, setUrl] = useState("");
    const [generatedLink, setGeneratedLink] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;

        // Basic validation
        let targetUrl = url;
        if (!/^https?:\/\//i.test(targetUrl)) {
            targetUrl = "https://" + targetUrl;
        }

        const slug = encodeLink(targetUrl);
        // Use window.location.origin to get the current host
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        // REMOVED /u/ prefix
        setGeneratedLink(`${origin}/${slug}`);
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
            <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex flex-col gap-10">
                <h1 className="text-4xl font-bold mb-8 text-center">Link Wrapper</h1>

                <div className="w-full max-w-md p-6 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-700">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <label htmlFor="url-input" className="block text-sm font-medium mb-1">
                                Enter URL to wrap
                            </label>
                            <input
                                id="url-input"
                                type="text"
                                placeholder="https://example.com"
                                className="w-full p-3 rounded-lg border border-gray-300 dark:border-zinc-600 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
                        >
                            Wrap Link
                        </button>
                    </form>

                    {generatedLink && (
                        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                            <p className="text-xs uppercase tracking-wider text-blue-500 mb-1 font-semibold">
                                Generated Link
                            </p>
                            <div className="flex items-center gap-2">
                                <a
                                    href={generatedLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="break-all text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                >
                                    {generatedLink}
                                </a>
                            </div>
                            <button
                                onClick={() => navigator.clipboard.writeText(generatedLink)}
                                className="mt-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                            >
                                Copy to clipboard
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
