import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { key } = await req.json();

        if (!key) {
            return NextResponse.json({ error: 'API Key is required' }, { status: 400 });
        }

        // Test the key with LinkShortify
        const testUrl = 'https://google.com';
        const apiUrl = `https://linkshortify.com/api?api=${key}&url=${encodeURIComponent(testUrl)}&format=text`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        try {
            const response = await fetch(apiUrl, { signal: controller.signal });
            clearTimeout(timeoutId);
            const shortLink = await response.text();

            if (!response.ok || !shortLink || shortLink.includes('error') || shortLink.trim() === '') {
                return NextResponse.json({
                    error: 'Invalid API Key. Please ensure your LinkShortify key is correct.',
                    details: shortLink
                }, { status: 400 });
            }

            // Key is valid, update the user in DB
            await dbConnect();
            const user = await User.findOneAndUpdate(
                { email: session.user.email },
                { linkShortifyKey: key },
                { new: true }
            );

            if (!user) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }

            return NextResponse.json({
                success: true,
                message: 'API Key validated and saved successfully.'
            });

        } catch (e: any) {
            return NextResponse.json({ error: 'Shortener API Timeout or Network Error' }, { status: 504 });
        }

    } catch (error) {
        console.error('Update Key Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
