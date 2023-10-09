import { Module } from '@nestjs/common';
import { AppController } from './msg/msg.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { GatewayModule } from './gateway/gateway.module';

@Module({
  imports: [PrismaModule, GatewayModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
