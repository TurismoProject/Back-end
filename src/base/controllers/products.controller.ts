import { FileCountInterceptor } from '@interceptors/file-count.interceptor';
import { FilesToURLPipe } from '@pipes/files-to-url.pipe';
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
  Delete,
  ParseUUIDPipe,
  Get,
  Query,
  Param,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Category, Product } from '@prisma/client';
import { AbstractProductsRepository } from '@repositories/products/abstract-products.repository';
import { CategoryValidatorPipe } from '@validators/category.validator';
import { FileSizeValidatorPipe } from '@validators/file-size.validator';
import { FileTypeValidatorPipe } from '@validators/file-type.validator';
import { StrangeLinkInterceptor } from '@interceptors/strange-link.interceptor';
import { Request } from 'express';

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

  @Patch('atualizar')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FilesInterceptor('images'),
    FileCountInterceptor({ maxCount: 5 }),
    StrangeLinkInterceptor(),
  )
  async update(
    @UploadedFiles(
      FileTypeValidatorPipe,
      new FileSizeValidatorPipe({ fileMaxSize: 5e6, imageMaxSize: 1e8 }),
      FilesToURLPipe({ fileOptional: true }),
    )
    images: Array<string>,
    @Body() body: UpdateProductDto,
    @Req() req: Request,
  ) {
    const dbUrls: Array<string> = req['repoUrls'];

    if (body.imagesUrl)
      if (!dbUrls.every((url) => body.imagesUrl.includes(url)))
        await this.repository.removeUrl(
          body.id,
          dbUrls.filter((url) => !body.imagesUrl.includes(url)),
        );

    const updatedProduct = images
      ? await this.repository.update(body, images)
      : await this.repository.update(body);

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
