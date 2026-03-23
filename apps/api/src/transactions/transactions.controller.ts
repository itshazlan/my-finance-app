import { Body, Controller, Get, Post, Put, Delete, Param, Query, UseGuards, Request } from '@nestjs/common';
import { TransactionsService } from './transactions.service.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { UpdateTransactionDto } from './dto/update-transaction.dto.js';
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
    async getSummary(
        @Request() req: any,
        @Query('month') month?: string,
        @Query('year') year?: string
    ) {
        const userId = req.user.sub || req.user.id;
        const m = month ? parseInt(month, 10) : undefined;
        const y = year ? parseInt(year, 10) : undefined;
        return this.transactionsService.getSummary(userId, m, y);
    }

    @UseGuards(AuthGuard)
    @Get('weekly')
    async getWeeklyReport(
        @Request() req: any,
        @Query('month') month?: string,
        @Query('year') year?: string
    ) {
        const userId = req.user.sub || req.user.id;
        const m = month ? parseInt(month, 10) : undefined;
        const y = year ? parseInt(year, 10) : undefined;
        return this.transactionsService.getWeeklyReport(userId, m, y);
    }

    @UseGuards(AuthGuard)
    @Get()
    async findAll(
        @Request() req: any,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
        @Query('month') month?: string,
        @Query('year') year?: string
    ) {
        const userId = req.user.sub || req.user.id;
        const p = parseInt(page, 10) || 1;
        const l = parseInt(limit, 10) || 10;
        const m = month ? parseInt(month, 10) : undefined;
        const y = year ? parseInt(year, 10) : undefined;
        return this.transactionsService.findAll(userId, p, l, m, y);
    }

    @UseGuards(AuthGuard)
    @Delete(':id')
    async remove(@Param('id') id: string, @Request() req: any) {
        const userId = req.user.sub || req.user.id;
        return this.transactionsService.remove(id, userId);
    }

    @UseGuards(AuthGuard)
    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() updateTransactionDto: UpdateTransactionDto,
        @Request() req: any
    ) {
        const userId = req.user.sub || req.user.id;
        return this.transactionsService.update(id, userId, updateTransactionDto);
    }
}
