import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  IsUrl,
  IsOptional,
  IsJSON,
  IsDecimal,
  IsArray,
} from 'class-validator';
import { Category } from '@prisma/client';

export class CreateSupplierDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsStrongPassword({
    minLength: 6,
    minLowercase: 0,
  })
  password: string;

  @IsNotEmpty()
  @IsString()
  cnpj: string;

  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  businessHours?: string;

  @IsDecimal()
  @IsOptional()
  rating?: number;

  @IsArray()
  @IsOptional()
  categories?: Category[];

  @IsUrl()
  @IsOptional()
  website?: string;

  @IsString()
  @IsOptional()
  logo?: string;

  @IsJSON()
  @IsOptional()
  socialMedia?: string;
}
