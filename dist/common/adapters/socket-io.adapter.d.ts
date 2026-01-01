import { IoAdapter } from "@nestjs/platform-socket.io";
import { ServerOptions } from "socket.io";
export declare class SocketIoAdapter extends IoAdapter {
    createIOServer(port: number, options?: ServerOptions): any;
}
