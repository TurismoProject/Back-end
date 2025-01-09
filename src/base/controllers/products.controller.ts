import { FileCountInterceptor } from '@interceptors/file-count.interceptor';
import { CreateProductDto } from '@dtos/create-product.dto';
import { UpdateProductDto } from '@dtos/update-product.dto';
import {
  Body,
  Controller,
  HttpCode,
  Post,
  UploadedFiles,
  UseInterceptors,
  HttpStatus,
  Delete,
  ParseUUIDPipe,
  Get,
  Query,
  Param,
  ParseIntPipe,
  Put,
  Headers,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Category, Product } from '@prisma/client';
import { AbstractProductsRepository } from '@repositories/products/abstract-products.repository';
import { CategoryValidatorPipe } from '@validators/category.validator';
import { FileSizeValidatorPipe } from '@validators/file-size.validator';
import { FileTypeValidatorPipe } from '@validators/file-type.validator';

@Controller('produto')
export class ProductsController {
  constructor(private readonly repository: AbstractProductsRepository) {}

  @Post('criar')
  @HttpCode(HttpStatus.CREATED)
  async createProduct(@Body() body: CreateProductDto) {
    const createdProduct = await this.repository.create(body);

    return {
      name: createdProduct.name,
      description: createdProduct.description,
      price: createdProduct.price.toNumber(),
      productId: createdProduct.id,
    };
  }

  @Post('adicionar-imagem')
  @UseInterceptors(
    FilesInterceptor('images', 5),
    FileCountInterceptor({ maxCount: 5 }),
  )
  async addImage(
    @UploadedFiles(
      FileTypeValidatorPipe,
      new FileSizeValidatorPipe({ fileMaxSize: 5e6, imageMaxSize: 1e8 }),
    )
    images: Array<Express.Multer.File>,
    @Body('id', new ParseUUIDPipe()) productId: string,
    @Body('position', new ParseIntPipe({ optional: true })) position?: number,
  ) {
    let imagesPositionsArray: Array<string> = [];
    for (let i = 1; i <= images.length; i++) {
      const fileName = await this.repository.addImageToProduct(
        productId,
        images[i - 1],
        position ? position + i : i,
      );
      imagesPositionsArray.push(fileName);
    }

    return imagesPositionsArray;
  }

  @Put('atualizar')
  @HttpCode(HttpStatus.OK)
  async updateProduct(@Body() body: UpdateProductDto) {
    const updatedProduct = await this.repository.updateProduct(body);

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
    await this.repository.deleteProduct(uuid);

    return {
      message: 'Produto excluído com sucesso!',
    };
  }

  @Get('busca')
  @HttpCode(HttpStatus.OK)
  async getProducts(
    @Query('categoria', CategoryValidatorPipe) category: Category,
    @Query('estrelas') rating: number,
    @Query('limite', new ParseIntPipe({ optional: true }))
    productsLimit: number,
    @Query('min') minPrice: number,
    @Query('max') maxPrice: number,
  ) {
    const products = (
      await this.repository.search(
        undefined,
        category,
        rating,
        productsLimit,
        minPrice,
        maxPrice,
      )
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
    @Query('estrelas') rating: number,
    @Query('limite', new ParseIntPipe({ optional: true }))
    productsLimit: number,
    @Query('min') minPrice: number,
    @Query('max') maxPrice: number,
  ) {
    const products = (
      await this.repository.search(
        name,
        category,
        rating,
        productsLimit,
        minPrice,
        maxPrice,
      )
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
    const product = await this.repository.findProductById(uuid);
    return product;
  }
}
