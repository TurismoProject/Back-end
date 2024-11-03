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

  @Post('criar')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FilesInterceptor('images', 5))
  async create(
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
    const createdProduct = await this.repository.create(body, images);

    return {
      name: createdProduct.name,
      description: createdProduct.description,
      price: createdProduct.price,
      images: createdProduct.imagesUrl,
    };
  }
}
