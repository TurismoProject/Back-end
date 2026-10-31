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
<<<<<<< Updated upstream
=======

  @Post('adicionar-imagem')
  @UseInterceptors(
    FilesInterceptor('images'),
    FileCountInterceptor({ maxCount: 10, minCount: 5 }),
  )
  async addImage(
    @UploadedFiles(
      FileTypeValidatorPipe,
      new FileSizeValidatorPipe({ fileMaxSize: 5e6, imageMaxSize: 1e8 }),
    )
    images: Array<Express.Multer.File>,
    @Body('id', new ParseUUIDPipe()) productId: string,
  ) {
    const imagesPositionsArray: Array<string> = [];
    for (let i = 1; i <= images.length; i++) {
      const fileName = await this.repository.addImageToProduct(
        productId,
        images[i - 1],
      );
      imagesPositionsArray.push(fileName);
    }

    return imagesPositionsArray;
  }

  @Put('atualizar')
  @HttpCode(HttpStatus.OK)
  async updateProduct(@Body() body: UpdateProductDto) {
    const updatedProduct = await this.repository.update(body.id, body);

    return {
      name: updatedProduct.name,
      description: updatedProduct.description,
      price: updatedProduct.price,
    };
  }

  @Put('atualizar-imagens')
  @HttpCode(HttpStatus.OK)
  async updateImagesPosition(
    @Body('id', new ParseUUIDPipe()) productId: string,
    @Body('imagesPositions') imagesPositionsArray: Array<string>,
  ) {
    await this.repository.updateProductImagePosition(
      productId,
      imagesPositionsArray,
    );
  }

  @Delete('excluir')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Body('uuid', new ParseUUIDPipe()) uuid: string) {
    await this.repository.delete(uuid);

    return {
      message: 'Produto excluído com sucesso!',
    };
  }

  @Get('busca')
  @HttpCode(HttpStatus.OK)
  async getProducts(
    @Query('categoria', CategoryValidatorPipe) category: Category,
    @Query('estrelas') minRating: number,
    @Query('limite', new ParseIntPipe({ optional: true }))
    limit: number = 20,
    @Query('min') minPrice: number,
    @Query('max') maxPrice: number,
  ) {
    const products = (
      await this.repository.search({
        limit,
        name: undefined,
        category,
        minRating,
        minPrice,
        maxPrice,
      })
    ).reduce(
      (
        acc: {
          name: string;
          description: string;
          price: number;
          id: string;
        }[],
        product: Product,
      ) => {
        acc.push({
          name: product.name,
          description: product.description,
          price: product.price.toNumber(),
          id: product.id,
        });

        return acc;
      },
      [],
    );

    return products;
  }

  @Get('busca/:nome')
  @HttpCode(HttpStatus.OK)
  async searchProducts(
    @Param('nome') name: string,
    @Query('categoria', CategoryValidatorPipe) category: Category,
    @Query('estrelas') minRating: number,
    @Query('limite', new ParseIntPipe({ optional: true }))
    limit: number,
    @Query('min') minPrice: number,
    @Query('max') maxPrice: number,
  ) {
    const products = (
      await this.repository.search({
        limit,
        name,
        category,
        minRating,
        minPrice,
        maxPrice,
      })
    ).reduce(
      (
        acc: {
          name: string;
          description: string;
          price: number;
          id: string;
        }[],
        product: Product,
      ) => {
        acc.push({
          name: product.name,
          description: product.description,
          price: product.price.toNumber(),
          id: product.id,
        });

        return acc;
      },
      [],
    );

    return products;
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getProduct(@Headers('uuid') uuid: string) {
    const product = await this.repository.findById(uuid);
    return product;
  }
>>>>>>> Stashed changes
}
