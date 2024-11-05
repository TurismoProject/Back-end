import { FilesToURLPipe } from '@common/pipes/files-to-url.pipe';
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
  Patch,
  ParseFilePipeBuilder,
  Delete,
  ParseUUIDPipe,
  Get,
  Query,
  Param,
  ParseIntPipe,
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
  @UseInterceptors(FilesInterceptor('images', 5))
  async create(
    @UploadedFiles(
      FileTypeValidatorPipe,
      new FileSizeValidatorPipe({ fileMaxSize: 5e6, imageMaxSize: 1e8 }),
      FilesToURLPipe({ fileOptional: true }),
    )
    images: Array<string>,
    @Body() body: CreateProductDto,
  ) {
    const createdProduct = await this.repository.create(body, images);

    return {
      name: createdProduct.name,
      description: createdProduct.description,
      price: createdProduct.price.toNumber(),
      images: createdProduct.imagesUrl,
    };
  }

  //TODO: Implementar a atualização de adição/posição de imagens
  @Patch('atualizar')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FilesInterceptor('images'))
  async update(
    @UploadedFiles(
      FileTypeValidatorPipe,
      new FileSizeValidatorPipe({ fileMaxSize: 5e6, imageMaxSize: 1e8 }),
      FilesToURLPipe({ fileOptional: false }),
    )
    images: Array<string>,
    @Body() body: UpdateProductDto,
  ) {
    const updatedProduct = await this.repository.update(body, images);

    return {
      name: updatedProduct.name,
      description: updatedProduct.description,
      price: updatedProduct.price,
      images: updatedProduct.imagesUrl,
    };
  }

  @Delete('excluir')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Body('uuid', new ParseUUIDPipe()) uuid: string) {
    await this.repository.delete(uuid);

    return {
      message: 'Produto excluído com sucesso!',
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getProducts(
    @Query('categoria', CategoryValidatorPipe) category: Category,
    @Query('estrelas') rating: number,
    @Query('limite', ParseIntPipe) productsLimit: number,
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
          images: string[];
        }[],
        product: Product,
      ) => {
        acc.push({
          name: product.name,
          description: product.description,
          price: product.price.toNumber(),
          images: product.imagesUrl,
        });

        return acc;
      },
      [],
    );

    return products;
  }

  @Get(':nome')
  @HttpCode(HttpStatus.OK)
  async searchProducts(
    @Param('nome') name: string,
    @Query('categoria', CategoryValidatorPipe) category: Category,
    @Query('estrelas') rating: number,
    @Query('limite') productsLimit: number,
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
          images: string[];
        }[],
        product: Product,
      ) => {
        acc.push({
          name: product.name,
          description: product.description,
          price: product.price.toNumber(),
          images: product.imagesUrl,
        });

        return acc;
      },
      [],
    );

    return products;
  }
}
