import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Session from '@/models/Session';

export async function GET(req: Request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json({ error: 'Missing token' }, { status: 400 });
        }

        // 1. Find Session
        const session = await Session.findOne({ token });

        if (!session) {
            return NextResponse.json({ error: 'Link expired or invalid' }, { status: 404 });
        }

        // 2. Check Anti-Replay
        if (session.used) {
            return NextResponse.json({ error: 'Link already used' }, { status: 410 }); // 410 Gone
        }

        // 3. Mark as Used
        session.used = true;
        await session.save();

        // 4. Redirect
        return NextResponse.redirect(session.targetUrl);

    } catch (error) {
        console.error('V5 Resolve Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
