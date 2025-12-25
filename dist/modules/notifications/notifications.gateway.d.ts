import { JwtService } from '@nestjs/jwt';
import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotificationsService } from './notifications.service';
export declare class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly notificationsService;
    private readonly jwtService;
    server: Server;
    constructor(notificationsService: NotificationsService, jwtService: JwtService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleJoin(client: Socket): void;
    emitNewNotification(notification: any): Promise<void>;
    emitNotificationUpdate(notification: any): Promise<void>;
}
