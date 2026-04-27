import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: true, credentials: true },
  transports: ['websocket', 'polling'],
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger('EventsGateway');

  handleConnection(client: Socket) {
    this.logger.log(`client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe:webhook')
  subscribeWebhook(
    @MessageBody() data: { webhookId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data?.webhookId) return { ok: false };
    client.join(`webhook:${data.webhookId}`);
    return { ok: true, room: `webhook:${data.webhookId}` };
  }

  @SubscribeMessage('unsubscribe:webhook')
  unsubscribeWebhook(
    @MessageBody() data: { webhookId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data?.webhookId) return { ok: false };
    client.leave(`webhook:${data.webhookId}`);
    return { ok: true };
  }

  @SubscribeMessage('subscribe:company')
  subscribeCompany(
    @MessageBody() data: { companyId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data?.companyId) return { ok: false };
    client.join(`company:${data.companyId}`);
    return { ok: true, room: `company:${data.companyId}` };
  }

  @SubscribeMessage('unsubscribe:company')
  unsubscribeCompany(
    @MessageBody() data: { companyId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data?.companyId) return { ok: false };
    client.leave(`company:${data.companyId}`);
    return { ok: true };
  }

  emitNewRequest(payload: {
    webhookId: string;
    companyId: string;
    request: any;
  }) {
    this.server.to(`webhook:${payload.webhookId}`).emit('request:new', payload);
    this.server.to(`company:${payload.companyId}`).emit('request:new', payload);
    this.server.emit('request:new:any', payload);
  }
}
