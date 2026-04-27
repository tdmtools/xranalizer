import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CompanyDocument = HydratedDocument<Company>;

@Schema({ timestamps: true, collection: 'companies' })
export class Company {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true, lowercase: true, unique: true, index: true })
  slug: string;

  @Prop({ trim: true })
  description?: string;
}

export const CompanySchema = SchemaFactory.createForClass(Company);
