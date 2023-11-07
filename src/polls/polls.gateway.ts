import { Logger } from '@nestjs/common';
import { OnGatewayInit, WebSocketGateway, OnGatewayConnection, OnGatewayDisconnect, WebSocketServer, SubscribeMessage, WsException } from '@nestjs/websockets';
import { PollsService } from './pools.service';
import { Namespace } from 'socket.io';
import { SocketWithAuth } from './polls.type';

@WebSocketGateway({
    namespace: 'polls',
})
export class PollsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(PollsGateway.name);
    constructor(private readonly pollsService: PollsService) { }

    @WebSocketServer() io: Namespace;

    async handleConnection(client: SocketWithAuth) {
        const sockets = this.io.sockets;

        const { pollID, userID, name } = client;
        await client.join(pollID);

        const connectedClients = this.io.adapter.rooms?.get(pollID)?.size ?? 0;

        this.logger.debug(
            `userID: ${userID} joined room with name: ${pollID}`,
        );
        this.logger.debug(`Number of connected sockets: ${sockets.size}`);
        this.logger.debug(
            `Total clients connected to room '${pollID}': ${connectedClients}`,
        );

        const updatedPoll = await this.pollsService.addParticipant({
            pollID,
            userID,
            name
        });

        this.io.to(pollID).emit('poll_updated', updatedPoll);
    }

    async handleDisconnect(client: SocketWithAuth) {
        const sockets = this.io.sockets;

        const { pollID, userID } = client;
        const updatedPoll = await this.pollsService.removeParticipant(
            pollID,
            userID,
        );

        const clientCount = this.io.adapter.rooms?.get(pollID)?.size ?? 0;

        this.logger.log(`Disconnected socket id: ${client.id}`);
        this.logger.debug(`Number of connected sockets: ${sockets.size}`);
        this.logger.debug(
            `Total clients connected to room '${pollID}': ${clientCount}`,
        );

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

    @SubscribeMessage('test')
    async test() {
        throw new WsException({ field: 'field', message: 'You screwed up' })
    }
}