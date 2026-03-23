import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { UpdateTransactionDto } from './dto/update-transaction.dto.js';

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

    // Fungsi untuk mengambil semua riwayat transaksi milik user tertentu (Dengan Pagination & Filter Bulan Tahun)
    async findAll(userId: string, page: number = 1, limit: number = 10, month?: number, year?: number) {
        const filters: any = { userId };
        
        if (month !== undefined && year !== undefined) {
             const startDate = new Date(year, month - 1, 1);
             const endDate = new Date(year, month, 0, 23, 59, 59);
             filters.date = {
                 gte: startDate,
                 lte: endDate,
             };
        }

        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.prisma.transaction.findMany({
                where: filters,
                include: {
                    category: {
                        select: { name: true, type: true },
                    },
                },
                orderBy: {
                    date: 'desc',
                },
                skip,
                take: limit,
            }),
            this.prisma.transaction.count({ where: filters })
        ]);

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    // Fungsi untuk menghitung total pemasukan dan pengeluaran (Bisa difilter bulan & tahun)
    async getSummary(userId: string, month?: number, year?: number) {
        const now = new Date();
        const targetYear = year ?? now.getFullYear();
        const targetMonth = month ?? (now.getMonth() + 1);

        const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
        const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

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

    // Fungsi untuk mengambil data transaksi 7 hari terakhir (Bisa dimodifikasi mengikuti tanggal akhir filter)
    async getWeeklyReport(userId: string, month?: number, year?: number) {
        const now = new Date();
        let referenceDate = now;
        
        if (month !== undefined && year !== undefined) {
             const endOfMonth = new Date(year, month, 0);
             // Jika filter bulan = bulan sekarang, pakai now(), jika bukan, pakai akhir bulan.
             if (year !== now.getFullYear() || month !== now.getMonth() + 1) {
                 referenceDate = endOfMonth;
             }
        }

        const sevenDaysAgo = new Date(referenceDate);
        sevenDaysAgo.setDate(referenceDate.getDate() - 6);
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
            const d = new Date(referenceDate);
            d.setDate(referenceDate.getDate() - i);
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

    // Fungsi untuk menghapus transaksi
    async remove(id: string, userId: string) {
        // Pastikan transaksi ini ada dan milik userId
        const transaction = await this.prisma.transaction.findFirst({
            where: { id, userId }
        });

        if (!transaction) return null;

        return this.prisma.transaction.delete({
            where: { id }
        });
    }

    // Fungsi untuk update transaksi
    async update(id: string, userId: string, dto: UpdateTransactionDto) {
        const transaction = await this.prisma.transaction.findFirst({
            where: { id, userId }
        });

        if (!transaction) return null;

        return this.prisma.transaction.update({
            where: { id },
            data: {
                amount: dto.amount,
                type: dto.type,
                description: dto.description,
                date: dto.date ? new Date(dto.date) : undefined,
                categoryId: dto.categoryId,
            }
        });
    }
}
