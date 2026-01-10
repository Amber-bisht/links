import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export const { handlers, auth, signIn, signOut } = NextAuth({
    trustHost: true,
    adapter: MongoDBAdapter(clientPromise),
    providers: [
        Google,
    ],
    callbacks: {
        async session({ session, user }) {
            // Attach custom fields from the User document to the session
            if (session.user) {
                // @ts-ignore
                session.user.linkShortifyKey = user.linkShortifyKey;
                session.user.id = user.id;
                // @ts-ignore
                session.user.validUntil = user.validUntil;
                // @ts-ignore
                session.user.role = user.role;
            }
            return session;
        }
    },
    events: {
        async createUser({ user }) {
            try {
                // Set default validity to 2 days from now
                const validUntil = new Date();
                validUntil.setDate(validUntil.getDate() + 2);

                const client = await clientPromise;
                const users = client.db().collection("users");

                // @ts-ignore
                await users.updateOne({ _id: new ObjectId(user.id) }, {
                    $set: {
                        validUntil: validUntil,
                        role: 'user'
                    }
                });
                console.log(`Initialized user ${user.id} with validity until ${validUntil}`);
            } catch (e) {
                console.error("Failed to init user validity", e);
            }
        }
    }
})
