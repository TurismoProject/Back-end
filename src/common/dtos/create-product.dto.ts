import { IsCategoryArray } from '@common/decorators/is-category-array.decorator';
import { Category } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDecimal,
  IsInt,
  IsJSON,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { WorkingHoursDto } from './create-workinghours.dto';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsDecimal()
  @IsNotEmpty()
  price: number;

  @IsUUID()
  @IsNotEmpty()
  supplierId: string;

  @IsArray()
  @IsCategoryArray()
  @ArrayNotEmpty()
  categories: Category[];

  @IsInt()
  @Min(1)
  @IsOptional()
  maxGroupSize?: number;

  @IsInt()
  @Min(0)
  duration: number;

  @IsString()
  @IsNotEmpty()
  meetingPoint: string;

  @IsString()
  @IsNotEmpty()
  endingPoint: string;

  @IsString()
  @IsNotEmpty()
  cancellationPolicy: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  includedItems?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  excludedItems?: string[];

  @IsJSON()
  @IsNotEmpty()
  itinerary: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  minAge?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  languages?: string[];

  @IsBoolean()
  @IsOptional()
  b2bAvailable?: boolean;

  @IsInt()
  @Min(1)
  @IsOptional()
  b2bMinQuantity?: number;

  @IsDecimal()
  @IsOptional()
  b2bDiscount?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  bulkAvailability?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkingHoursDto)
  workingHours?: WorkingHoursDto[];
}
