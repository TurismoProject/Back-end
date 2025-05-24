import { BusinessType } from '@prisma/client';
import {
  IsBoolean,
  IsDate,
  IsDecimal,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class CreateBusinessClientDto {
  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsString()
  companyName: string;

  @IsNotEmpty()
  @IsString()
  cnpj: string;

  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsNotEmpty()
  @IsString()
  businessType: BusinessType;

  @IsDecimal()
  creditLimit?: number;

  @IsBoolean()
  isVerified?: boolean;

  @IsNotEmpty()
  @IsDate()
  contractStart: Date;

  @IsDate()
  contractEnd?: Date;
}
