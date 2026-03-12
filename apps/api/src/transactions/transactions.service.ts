import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';

@Injectable()
export class TransactionsService {
    constructor(private readonly prisma: PrismaService) { }

    // Fungsi untuk mencatat pengeluaran/pemasukan baru
    async create(createTransactionDto: CreateTransactionDto, userId: string) {
        return this.prisma.transaction.create({
            data: {
                amount: createTransactionDto.amount,
                type: createTransactionDto.type,
                description: createTransactionDto.description,
                // Menghubungkan ke User dan Category yang sudah ada
                user: { connect: { id: userId } },
                category: { connect: { id: createTransactionDto.categoryId } },
            },
            include: {
                category: true, // Kembalikan data beserta info kategorinya
            },
        });
    }

    // Fungsi untuk mengambil semua riwayat transaksi milik user tertentu
    async findAll(userId: string) {
        return this.prisma.transaction.findMany({
            where: { userId },
            include: {
                category: {
                    select: { name: true, type: true },
                },
            },
            orderBy: {
                date: 'desc', // Urutkan dari yang terbaru
            },
        });
    }

    // Fungsi untuk menghitung total pemasukan dan pengeluaran bulan ini
    async getSummary(userId: string) {
        const now = new Date();
        // Set ke awal bulan ini
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        // Set ke akhir bulan ini
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        const summary = await this.prisma.transaction.groupBy({
            by: ['type'],
            where: {
                userId,
                date: {
                    gte: startOfMonth,
                    lte: endOfMonth,
                },
            },
            _sum: {
                amount: true,
            },
        });

        const result = {
            INCOME: 0,
            EXPENSE: 0,
            BALANCE: 0,
        };

        summary.forEach((item) => {
            if (item.type === 'INCOME') {
                result.INCOME = item._sum.amount || 0;
            } else if (item.type === 'EXPENSE') {
                result.EXPENSE = item._sum.amount || 0;
            }
        });

        result.BALANCE = result.INCOME - result.EXPENSE;

        return result;
    }

    // Fungsi untuk mengambil data transaksi 7 hari terakhir (untuk grafik mingguan)
    async getWeeklyReport(userId: string) {
        const now = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const transactions = await this.prisma.transaction.findMany({
            where: {
                userId,
                date: { gte: sevenDaysAgo },
            },
            select: { amount: true, type: true, date: true },
        });

        // Buat template 7 hari terakhir dengan default 0
        const days: Record<string, { hari: string; Pemasukan: number; Pengeluaran: number }> = {};
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            const key = d.toISOString().split('T')[0]; // 'YYYY-MM-DD'
            const label = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
            days[key] = { hari: label, Pemasukan: 0, Pengeluaran: 0 };
        }

        // Akumulasikan setiap transaksi ke hari yang tepat
        for (const t of transactions) {
            const key = new Date(t.date).toISOString().split('T')[0];
            if (days[key]) {
                if (t.type === 'INCOME') days[key].Pemasukan += t.amount;
                if (t.type === 'EXPENSE') days[key].Pengeluaran += t.amount;
            }
        }

        return Object.values(days);
    }
}
