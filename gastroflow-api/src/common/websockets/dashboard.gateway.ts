import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*'
  }
})
export class DashboardGateway {
    
  @WebSocketServer()
  private readonly server!: Server;

  @SubscribeMessage('dashboard.subscribe')
  async subscribeToDashboard(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      restaurantId: string;
    }
  ): Promise<void> {
    const room = this.createRestaurantRoom(payload.restaurantId);

    await client.join(room);
  }

  emitDashboardUpdated(restaurantId: string): void {
    const room = this.createRestaurantRoom(restaurantId);

    this.server
      .to(room)
      .emit('dashboard.updated', {
        restaurantId,
        occurredAt: new Date().toISOString()
      });
  }

  private createRestaurantRoom(restaurantId: string): string {
    return `restaurant:${restaurantId}`;
  }
}