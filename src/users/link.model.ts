import { Schema, model, Document } from 'mongoose';

export interface ILink extends Document {
  link: string;
  roles: string[];
}

export const LinkSchema = new Schema({
  link: { type: String, required: true },
  roles: { type: [String], required: true },
});

export const LinkModel = model<ILink>('Link', LinkSchema);