import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaService } from './prisma/prisma.service.js';
import { TransactionsModule } from './transactions/transactions.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { TelegramModule } from './telegram/telegram.module.js';

@Module({
  imports: [TransactionsModule, AuthModule, CategoriesModule, TelegramModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule { }
