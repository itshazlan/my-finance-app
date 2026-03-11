import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';

@Injectable()
export class TransactionsService {
    constructor(private readonly prisma: PrismaService) { }

    // Fungsi untuk mencatat pengeluaran/pemasukan baru
    async create(createTransactionDto: CreateTransactionDto) {
        return this.prisma.transaction.create({
            data: {
                amount: createTransactionDto.amount,
                type: createTransactionDto.type,
                description: createTransactionDto.description,
                // Menghubungkan ke User dan Category yang sudah ada
                user: { connect: { id: createTransactionDto.userId } },
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
}
