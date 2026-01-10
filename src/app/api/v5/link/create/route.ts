import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import Link from '@/models/Link';
import User from '@/models/User'; // Ensure User model is loaded
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        // Check Validity via DB to get latest status (session might be stale)
        // We assume the user exists because they are authenticated
        const user = await User.findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const now = new Date();
        if (!user.validUntil || new Date(user.validUntil) < now) {
            return NextResponse.json({
                error: 'Subscription Expired. Please contact admin to renew.',
                code: 'EXPIRED'
            }, { status: 403 });
        }

        const { targetUrl, customSlug } = await req.json();

        if (!targetUrl) {
            return NextResponse.json({ error: 'targetUrl is required' }, { status: 400 });
        }

        let slug = customSlug;
        if (!slug) {
            slug = crypto.randomBytes(3).toString('hex');
        }

        // Check slug uniqueness
        const existing = await Link.findOne({ slug });
        if (existing) {
            return NextResponse.json({ error: 'Slug already taken' }, { status: 409 });
        }

        const newLink = await Link.create({
            slug,
            targetUrl,
            ownerId: user._id, // Link to the user
        });

        return NextResponse.json({
            success: true,
            slug: newLink.slug
        });

    } catch (error) {
        console.error('Create Link Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
