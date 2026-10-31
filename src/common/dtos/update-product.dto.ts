import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { IsNotEmpty, IsUUID } from 'class-validator';

<<<<<<< Updated upstream
export class UpdateProductDto extends PartialType(CreateProductDto) {
=======
export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, ['supplierId']),
) {
>>>>>>> Stashed changes
  @IsUUID()
  @IsNotEmpty()
  id: string;
}
