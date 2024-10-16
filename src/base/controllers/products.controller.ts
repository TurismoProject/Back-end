import { FileToURLPipe } from '@common/pipes/file-to-url.pipe';
import { BucketService } from '@database/bucket/bucket.service';
import {
  Controller,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AbstractProductsRepository } from '@repositories/products/abstract-products.repository';

@Controller('produto')
export class ProductsController {
  constructor(
    protected readonly bucketService: BucketService,
    protected readonly repository: AbstractProductsRepository,
  ) {}

  @Post('criar')
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10000000 }),
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
        ],
      }),
      FileToURLPipe,
    )
    image: string,
  ) {
    return image;
  }
}
