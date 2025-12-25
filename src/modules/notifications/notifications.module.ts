import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { CompanyClaim, CompanyClaimSchema } from '../../database/schemas/company-claim.schema';
import { Notification, NotificationSchema } from '../../database/schemas/notification.schema';
import { Product, ProductSchema } from '../../database/schemas/product.schema';
import { SRIssue, SRIssueSchema } from '../../database/schemas/sr-issue.schema';
import { SRPayment, SRPaymentSchema } from '../../database/schemas/sr-payment.schema';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsScheduler } from './notifications.scheduler';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: Product.name, schema: ProductSchema },
      { name: SRIssue.name, schema: SRIssueSchema },
      { name: SRPayment.name, schema: SRPaymentSchema },
      { name: CompanyClaim.name, schema: CompanyClaimSchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway, NotificationsScheduler],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}

