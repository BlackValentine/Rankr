import { Logger, UseGuards } from '@nestjs/common';
import {
  OnGatewayInit,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { PollsService } from './pools.service';
import { Namespace } from 'socket.io';
import { SocketWithAuth } from './polls.type';
import { GatewayAdminGuard } from './gateway-admin.guard';

@WebSocketGateway({
  namespace: 'polls',
})
export class PollsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(PollsGateway.name);
  constructor(private readonly pollsService: PollsService) {}

  @WebSocketServer() io: Namespace;

  async handleConnection(client: SocketWithAuth) {
    const sockets = this.io.sockets;

    const { pollID, userID, name } = client;
    await client.join(pollID);

    const connectedClients = this.io.adapter.rooms?.get(pollID)?.size ?? 0;

    this.logger.debug(`userID: ${userID} joined room with name: ${pollID}`);
    this.logger.debug(`Number of connected sockets: ${sockets.size}`);
    this.logger.debug(`Total clients connected to room '${pollID}': ${connectedClients}`);

    const updatedPoll = await this.pollsService.addParticipant({
      pollID,
      userID,
      name,
    });

    this.io.to(pollID).emit('poll_updated', updatedPoll);
  }

  async handleDisconnect(client: SocketWithAuth) {
    const sockets = this.io.sockets;

    const { pollID, userID } = client;
    const updatedPoll = await this.pollsService.removeParticipant(pollID, userID);

    const clientCount = this.io.adapter.rooms?.get(pollID)?.size ?? 0;

    this.logger.log(`Disconnected socket id: ${client.id}`);
    this.logger.debug(`Number of connected sockets: ${sockets.size}`);
    this.logger.debug(`Total clients connected to room '${pollID}': ${clientCount}`);

    // updatedPoll could be undefined if the the poll already started
    // in this case, the socket is disconnect, but no the poll state
    if (updatedPoll) {
      this.io.to(pollID).emit('poll_updated', updatedPoll);
    }
  }

  // Gateway initialized (provided in module and instantiated)
  afterInit(): void {
    this.logger.log(`Websocket Gateway initialized.`);
  }

  @UseGuards(GatewayAdminGuard)
  @SubscribeMessage('remove_participant')
  async removeParticipant(@MessageBody('id') id: string, @ConnectedSocket() client: SocketWithAuth) {
    this.logger.debug(`Attempting to remove participant ${id} from poll: ${client.pollID}`);

    const updatedPoll = await this.pollsService.removeParticipant(client.pollID, id);

    if (updatedPoll) {
      this.io.to(client.pollID).emit('poll_updated', updatedPoll);
    }
  }
}
