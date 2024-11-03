import { Decimal } from '@prisma/client/runtime/library';
import { IsDecimal, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsDecimal()
  @IsNotEmpty()
  price: Decimal;

  @IsUUID()
  @IsNotEmpty()
  supplierId: string;
}
