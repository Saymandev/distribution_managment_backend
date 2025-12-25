import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SalesRepDocument = SalesRep & Document;

@Schema({ timestamps: true })
export class SalesRep {
  @Prop({ required: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  companyId: string; // SR belongs to a specific company

  @Prop()
  phone?: string;

  @Prop()
  email?: string;

  @Prop()
  address?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const SalesRepSchema = SchemaFactory.createForClass(SalesRep);

