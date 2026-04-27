import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type RequestLogDocument = HydratedDocument<RequestLog>;

@Schema({ timestamps: { createdAt: true, updatedAt: false }, collection: 'requests' })
export class RequestLog {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Webhook',
    required: true,
    index: true,
  })
  webhookId: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true,
  })
  companyId: Types.ObjectId;

  @Prop({ required: true, index: true })
  method: string;

  @Prop({ required: true })
  url: string;

  @Prop()
  path: string;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  query: Record<string, any>;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  headers: Record<string, any>;

  @Prop({ type: MongooseSchema.Types.Mixed })
  body: any;

  @Prop()
  rawBody: string;

  @Prop()
  contentType: string;

  @Prop({ default: 0 })
  contentLength: number;

  @Prop()
  ip: string;

  @Prop({ type: [String], default: [] })
  ips: string[];

  @Prop()
  userAgent: string;

  @Prop()
  protocol: string;

  @Prop()
  hostname: string;

  @Prop({ index: true })
  responseStatus: number;

  @Prop({ default: 0 })
  responseTimeMs: number;

  @Prop({ index: true })
  receivedAt: Date;
}

export const RequestLogSchema = SchemaFactory.createForClass(RequestLog);
RequestLogSchema.index({ webhookId: 1, receivedAt: -1 });
RequestLogSchema.index({ companyId: 1, receivedAt: -1 });
