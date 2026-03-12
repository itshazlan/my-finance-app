import { Body, Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { TransactionsService } from './transactions.service.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { AuthGuard } from '../auth/auth.guard.js';

@Controller('transactions')
export class TransactionsController {
    constructor(private readonly transactionsService: TransactionsService) { }

    @UseGuards(AuthGuard)
    @Post()
    async create(@Body() createTransactionDto: CreateTransactionDto, @Request() req: any) {
        const userId = req.user.sub || req.user.id;
        return this.transactionsService.create(createTransactionDto, userId);
    }

    @UseGuards(AuthGuard)
    @Get('summary')
    async getSummary(@Request() req: any) {
        const userId = req.user.sub || req.user.id;
        return this.transactionsService.getSummary(userId);
    }

    @UseGuards(AuthGuard)
    @Get('weekly')
    async getWeeklyReport(@Request() req: any) {
        const userId = req.user.sub || req.user.id;
        return this.transactionsService.getWeeklyReport(userId);
    }

    @UseGuards(AuthGuard)
    @Get()
    async findAll(@Request() req: any) {
        const userId = req.user.sub || req.user.id;
        return this.transactionsService.findAll(userId);
    }
}
