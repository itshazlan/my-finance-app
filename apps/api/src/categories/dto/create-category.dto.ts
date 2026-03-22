import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { TransactionType } from '../../generated/prisma/client.js';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(TransactionType)
  type: TransactionType;
}
