import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('TransactionsService', () => {
    let service: TransactionsService;
    let prisma: PrismaService;

    const mockPrismaService = {
        transaction: {
            groupBy: jest.fn<any>(),
            findMany: jest.fn<any>(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TransactionsService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<TransactionsService>(TransactionsService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getSummary', () => {
        it('should calculate balance correctly when income and expense exist', async () => {
            const userId = 'user-1';
            const mockGroupByResult = [
                { type: 'INCOME', _sum: { amount: 1000000 } },
                { type: 'EXPENSE', _sum: { amount: 400000 } },
            ];

            (prisma.transaction.groupBy as any).mockResolvedValue(mockGroupByResult);

            const result = await service.getSummary(userId);

            expect(result).toEqual({
                INCOME: 1000000,
                EXPENSE: 400000,
                BALANCE: 600000,
            });
            expect(prisma.transaction.groupBy).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ userId }),
                })
            );
        });

        it('should return zero balance when no transactions exist', async () => {
            const userId = 'user-2';
            const mockGroupByResult = [];

            (prisma.transaction.groupBy as any).mockResolvedValue(mockGroupByResult);

            const result = await service.getSummary(userId);

            expect(result).toEqual({
                INCOME: 0,
                EXPENSE: 0,
                BALANCE: 0,
            });
        });
    });

    describe('getWeeklyReport', () => {
        it('should aggregate transactions by day correctly', async () => {
            const userId = 'user-1';
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            
            const mockTransactions = [
                { 
                    amount: 50000, 
                    type: 'EXPENSE', 
                    date: now 
                },
                { 
                    amount: 100000, 
                    type: 'INCOME', 
                    date: now 
                }
            ];

            // Mock prisma.transaction.findMany
            (prisma.transaction.findMany as any).mockResolvedValue(mockTransactions);

            const result = await service.getWeeklyReport(userId);

            // result is an array of 7 days. We find today's entry.
            const todayReport = result.find(d => {
                // The label in result is d.toLocaleDateString('id-ID', ...)
                // But we can check if it aligns with the logic in getWeeklyReport
                // which uses now.getDate() - i.
                // It's easier to check the last element if it's today.
                return true; // Simplified for now, let's just check the last one.
            });

            const lastDay = result[result.length - 1];
            expect(lastDay.Pemasukan).toBe(100000);
            expect(lastDay.Pengeluaran).toBe(50000);
        });
    });
});
