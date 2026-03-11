import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto, userId: string) {
    const existing = await this.prisma.category.findUnique({
      where: {
        name_userId: {
          name: createCategoryDto.name,
          userId: userId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Kategori dengan nama ini sudah ada.');
    }

    return this.prisma.category.create({
      data: {
        ...createCategoryDto,
        userId: userId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category || category.userId !== userId) {
      throw new NotFoundException(`Kategori dengan ID ${id} tidak ditemukan.`);
    }

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto, userId: string) {
    await this.findOne(id, userId);

    if (updateCategoryDto.name) {
      const existing = await this.prisma.category.findFirst({
        where: {
          name: updateCategoryDto.name,
          userId: userId,
          id: { not: id },
        },
      });

      if (existing) {
        throw new BadRequestException('Kategori dengan nama ini sudah ada.');
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);

    const transactionsCount = await this.prisma.transaction.count({
      where: { categoryId: id },
    });

    if (transactionsCount > 0) {
      throw new BadRequestException('Kategori tidak dapat dihapus karena masih digunakan pada transaksi.');
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }
}
