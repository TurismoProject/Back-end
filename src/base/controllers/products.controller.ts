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
import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';

@ApiBearerAuth()
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
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    required: true,
    schema: {
      type: 'object',
      required: ['name', 'description', 'price', 'supplierId', 'images'],
      properties: {
        name: { type: 'string', example: 'Passeio de barco' },
        description: {
          type: 'string',
          example: 'Passeio de barco pela orla de Maceió.',
        },
        price: {
          type: 'string',
          example: '120.00',
          description: 'Valor decimal, sem R$ e com ponto como separador.',
        },
        supplierId: {
          type: 'string',
          format: 'uuid',
          description: 'ID do fornecedor retornado no login (supplier.id).',
        },
        images: {
          type: 'array',
          minItems: 1,
          maxItems: 5,
          items: { type: 'string', format: 'binary' },
          description: 'De 1 a 5 imagens PNG ou JPEG; até 10 MB por arquivo.',
        },
      },
    },
  })
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
