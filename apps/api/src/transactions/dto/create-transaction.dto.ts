import { TransactionType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateTransactionDto {
    @IsNumber()
    @Min(1)
    amount: number;

    @IsEnum(TransactionType)
    type: TransactionType;

    @IsString()
    @IsOptional()
    description?: string;

    @IsUUID()
    @IsNotEmpty()
    categoryId: string;
}