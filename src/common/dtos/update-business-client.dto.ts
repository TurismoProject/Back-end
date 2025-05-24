import { BusinessType } from '@prisma/client';
import { IsBoolean, IsDate, IsDecimal, IsString } from 'class-validator';

export class UpdateBusinessClientDto {
  @IsString()
  password?: string;

  @IsString()
  companyName?: string;

  @IsString()
  phoneNumber?: string;

  @IsString()
  address?: string;

  @IsString()
  businessType?: BusinessType;

  @IsDecimal()
  creditLimit?: number;

  @IsBoolean()
  isVerified?: boolean;

  @IsDate()
  contractEnd?: Date;
}
