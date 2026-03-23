import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { TelegramService } from './telegram.service.js';

@Module({
  providers: [TelegramService, PrismaService],
  exports: [TelegramService],
})
export class TelegramModule {}
