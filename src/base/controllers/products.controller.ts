import { UseGuards, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import {
  CurrentReservationActor,
  ReservationActor,
} from '../../reservations/auth/reservation-actor';
import {
  ReservationAccessGuard,
  ReservationRole,
} from '../../reservations/auth/reservation-access.guard';
import { FilesToURLPipe } from '@common/pipes/files-to-url.pipe';
import { BucketService } from '@database/bucket/bucket.service';
import { CreateProductDto } from '@dtos/create-product.dto';
import {
  Body,
  Controller,
  FileTypeValidator,
  HttpCode,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFiles,
  UseInterceptors,
  HttpStatus,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AbstractProductsRepository } from '@repositories/products/abstract-products.repository';

@Controller('produto')
export class ProductsController {
  constructor(
    private readonly bucketService: BucketService,
    private readonly repository: AbstractProductsRepository
  ) {}

  /**
   * Cadastra um produto apenas para o fornecedor da sessão e devolve seu ID.
   * O ID retornado é usado posteriormente na criação de saídas.
   */
  @Post('criar')
  @UseGuards(ReservationAccessGuard)
  @ReservationRole(Role.Supplier)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FilesInterceptor('images', 5))
  async create(
    @CurrentReservationActor() actor: ReservationActor,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10000000 }),
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
        ],
      }),
      FilesToURLPipe
    )
    images: Array<string>,
    @Body() body: CreateProductDto
  ) {
    if (body.supplierId !== actor.id)
      throw new NotFoundException('Fornecedor não encontrado.');
    const createdProduct = await this.repository.create(
      { ...body, supplierId: actor.id },
      images
    );

    return {
      id: createdProduct.id,
      name: createdProduct.name,
      description: createdProduct.description,
      price: createdProduct.price,
      images: createdProduct.imagesUrl,
    };
  }
}
