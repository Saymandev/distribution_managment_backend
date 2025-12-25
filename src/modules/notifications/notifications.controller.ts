import { Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(@Query('unreadOnly') unreadOnly?: string) {
    return this.notificationsService.findAll(unreadOnly === 'true');
  }

  @Get('count')
  async getUnreadCount() {
    const count = await this.notificationsService.getUnreadCount();
    return { count };
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Patch('read-all')
  markAllAsRead() {
    return this.notificationsService.markAllAsRead();
  }
}

