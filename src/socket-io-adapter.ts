import { INestApplicationContext, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { Server, ServerOptions } from "socket.io";
import { SocketWithAuth } from "./polls/polls.type";
import { NextFunction } from "express";

export class SocketIoAdapter extends IoAdapter {
  private readonly logger = new Logger(SocketIoAdapter.name);
  constructor(
    private app: INestApplicationContext,
    private configService: ConfigService,
  ) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions) {
    const clientPort = parseInt(this.configService.get('CLIENT_PORT'));

    const cors = {
      origin: [
        `http://localhost:${clientPort}`,
        new RegExp(`/^http:\/\/192\.168\.1\.([1-9]|[1-9]\d):${clientPort}$/`),
      ],
    };

    this.logger.log('Configuring SocketIO server with custom CORS options', {
      cors,
    });

    const optionsWithCORS: ServerOptions = {
      ...options,
      cors,
    };

    const jwtService = this.app.get(JwtService);
    const server: Server = super.createIOServer(port, optionsWithCORS)
    server.of('polls').use(createTokenMiddleware(jwtService, this.logger) as any);

    return server;
  }
}

const createTokenMiddleware = (jwtService: JwtService, logger: Logger) => (socket: SocketWithAuth, next: NextFunction) => {
  const token = socket.handshake.auth.token || socket.handshake.headers['token'];
  logger.log(`Validating auth token before connection: ${token}`)

  try {
    const payload = jwtService.verify(token);
    socket.userID = payload.sub;
    socket.pollID = payload.pollID;
    socket.name = payload.name;
    next();
  } catch (error) {
    next(new Error('FORBIDDEN'))
  }
}