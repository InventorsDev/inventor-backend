import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import type { HydratedDocument } from 'mongoose';

export enum LeadContributionType {
  PROJECT = 'project',
  FEATURE = 'feature',
  MENTORING = 'mentoring',
  DOCUMENTATION = 'documentation',
  EVENT = 'event',
  COMMUNITY = 'community',
  INCIDENT = 'incident',
  OTHER = 'other',
}

export type LeadContributionDocument = HydratedDocument<LeadContribution>;

@Schema()
export class LeadContribution {
  @Prop({ required: true, index: true, type: mongoose.Schema.Types.ObjectId })
  userId: mongoose.Types.ObjectId;

  @Prop({ required: true, index: true })
  type: LeadContributionType;

  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ type: Map, of: String })
  metadata: Map<string, string>;

  @Prop({ required: true, index: true })
  occourredAt: Date;

  @Prop({ required: true, index: true, type: mongoose.Schema.Types.ObjectId })
  addedBy: mongoose.Types.ObjectId;

  @Prop({ required: true })
  createdAt: Date;
}

export const LeadContributionSchema =
  SchemaFactory.createForClass(LeadContribution);
