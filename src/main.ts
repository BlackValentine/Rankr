import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SocketIoAdapter } from './socket-io-adapter';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Main (main.ts)');
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe())

  const configService = app.get(ConfigService);
  const port = parseInt(configService.get('PORT'));
  const clientPort = parseInt(configService.get('CLIENT_PORT'));

  app.enableCors({
    origin: [
      `http://localhost:${clientPort}`,
      new RegExp(`/^http:\/\/192\.168\.1\.([1-9]|[1-9]\d):${clientPort}$/`)
    ]
  });

  app.useWebSocketAdapter(new SocketIoAdapter(app, configService));

  await app.listen(port, () => {
    logger.log(`Server running on port ${port}`)
  });
}
bootstrap();
