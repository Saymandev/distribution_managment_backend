import { Document } from 'mongoose';
export type NotificationDocument = Notification & Document;
export declare enum NotificationType {
    INFO = "info",
    WARNING = "warning",
    ERROR = "error",
    SUCCESS = "success"
}
export declare enum NotificationCategory {
    STOCK = "stock",
    PAYMENT = "payment",
    CLAIM = "claim",
    RETURN = "return",
    EXPENSE = "expense",
    SYSTEM = "system"
}
export declare class Notification {
    title: string;
    message: string;
    type: NotificationType;
    category: NotificationCategory;
    read: boolean;
    readAt?: Date;
    link?: string;
    metadata?: Record<string, any>;
}
export declare const NotificationSchema: import("mongoose").Schema<Notification, import("mongoose").Model<Notification, any, any, any, Document<unknown, any, Notification, any, {}> & Notification & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Notification, Document<unknown, {}, import("mongoose").FlatRecord<Notification>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Notification> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
