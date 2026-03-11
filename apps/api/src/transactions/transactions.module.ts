import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller.js';
import { TransactionsService } from './transactions.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Module({
  controllers: [TransactionsController],
  providers: [TransactionsService, PrismaService]
})
export class TransactionsModule {}
