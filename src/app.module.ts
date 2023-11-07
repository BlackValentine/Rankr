import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PollsModule } from './polls/polls.module';
import { jwtModule } from './modules.config';

@Module({
  imports: [ConfigModule.forRoot(), PollsModule, jwtModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
