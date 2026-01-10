import mongoose, { Schema, Document } from 'mongoose';

export interface ILink extends Document {
    slug: string; // The short ID (e.g. "my-link")
    targetUrl: string;
    ownerId: mongoose.Types.ObjectId;
    createdAt: Date;
}

const LinkSchema: Schema = new Schema({
    slug: { type: String, required: true, unique: true, index: true },
    targetUrl: { type: String, required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Link || mongoose.model<ILink>('Link', LinkSchema);
