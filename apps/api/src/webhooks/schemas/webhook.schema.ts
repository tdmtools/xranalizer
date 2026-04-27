import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type WebhookDocument = HydratedDocument<Webhook>;

export const HTTP_METHODS = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
] as const;
export type HttpMethod = (typeof HTTP_METHODS)[number];

@Schema({ _id: false })
export class WebhookResponse {
  @Prop({ default: 200, min: 100, max: 599 })
  statusCode: number;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  headers: Record<string, string>;

  @Prop({ default: '' })
  body: string;

  @Prop({ default: 'application/json' })
  contentType: string;
}

export const WebhookResponseSchema = SchemaFactory.createForClass(WebhookResponse);

@Schema({ timestamps: true, collection: 'webhooks' })
export class Webhook {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true,
  })
  companyId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true, lowercase: true })
  path: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({
    type: [String],
    enum: HTTP_METHODS,
    default: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  })
  allowedMethods: HttpMethod[];

  @Prop({ type: WebhookResponseSchema, default: () => ({}) })
  response: WebhookResponse;

  @Prop({ default: true })
  enabled: boolean;
}

export const WebhookSchema = SchemaFactory.createForClass(Webhook);
WebhookSchema.index({ companyId: 1, path: 1 }, { unique: true });
