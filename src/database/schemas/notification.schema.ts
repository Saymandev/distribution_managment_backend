import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success',
}

export enum NotificationCategory {
  STOCK = 'stock',
  PAYMENT = 'payment',
  CLAIM = 'claim',
  RETURN = 'return',
  EXPENSE = 'expense',
  SYSTEM = 'system',
}

@Schema({ timestamps: true })
export class Notification {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ enum: NotificationType, default: NotificationType.INFO })
  type: NotificationType;

  @Prop({ enum: NotificationCategory, default: NotificationCategory.SYSTEM })
  category: NotificationCategory;

  @Prop({ default: false })
  read: boolean;

  @Prop({ type: Date, default: Date.now })
  readAt?: Date;

  @Prop()
  link?: string; // Optional link to related page (e.g., "/products", "/sr-payments/123")

  @Prop({ type: Object, required: false })
  metadata?: Record<string, any>; // Additional data (e.g., productId, companyId, etc.)
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ read: 1, createdAt: -1 });
NotificationSchema.index({ category: 1, createdAt: -1 });

