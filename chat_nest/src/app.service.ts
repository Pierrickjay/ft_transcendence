import { Injectable } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
