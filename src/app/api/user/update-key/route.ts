import { auth } from "@/auth"
import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import mongoose from "mongoose"

// Quick User model access without redefining everything
// The adapter creates the collection 'users' automatically.
const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    image: String,
    emailVerified: Date,
    linkShortifyKey: String, // Our custom field
}, { strict: false }); // Strict false allows other adapter fields

const UserPromise = mongoose.models.User || mongoose.model("User", UserSchema);

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { apiKey } = await req.json();
        if (!apiKey) {
            return NextResponse.json({ error: "API Key is required" }, { status: 400 });
        }

        await dbConnect();

        // Update USER
        await UserPromise.findOneAndUpdate(
            { email: session.user.email },
            { linkShortifyKey: apiKey }
        );

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Update Key Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
