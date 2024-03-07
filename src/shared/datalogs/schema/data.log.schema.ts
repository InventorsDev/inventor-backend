import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type DataLogDocument = DataLog & Document & any;

@Schema({ timestamps: true })
export class DataLog {
  @Prop({ index: true, type: MongooseSchema.Types.Mixed })
  data: object;

  @Prop({ index: true })
  traceId: string;

  @Prop({ index: true })
  level: string;
}

export const DataLogSchema = SchemaFactory.createForClass(DataLog);

DataLogSchema.index({
  'data.source': 1,
  'data.request': 1,
  'data.response': 1,
  'data.traceId': 1,
  'data.requestUrl': 1,
});
DataLogSchema.index({ 'data.traceId': 1 });
DataLogSchema.index({ 'data.ipAddress': 1 });
DataLogSchema.index({ 'data.logType': 1 });
DataLogSchema.index({ 'data.method': 1 });
DataLogSchema.index({ 'data.logStatusCode': 1 });
