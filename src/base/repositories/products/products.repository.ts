import { Injectable, NotFoundException } from '@nestjs/common';
import { AbstractProductsRepository } from './abstract-products.repository';
import { PrismaService } from '@database/prisma/prisma.service';
import { Product, Category } from '@prisma/client';
import { CreateProductDto } from '@dtos/create-product.dto';
import { UpdateProductDto } from '@dtos/update-product.dto';
import { FileService } from '@services/file.service';
import { Request } from 'express';

@Injectable()
export class ProductsRepository implements AbstractProductsRepository {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly fileService: FileService,
  ) {}

  async update(
    product: UpdateProductDto,
    images: Array<string> = undefined,
    req: Request = undefined,
  ): Promise<Product> {
    if (!images) {
      try {
        const updatedProduct = !product.imagesUrl
          ? await this.prismaService.product.update({
              where: { id: product.id },
              data: {
                description: product.description,
                name: product.name,
                price: product.price,
              },
            })
          : await this.prismaService.product.update({
              where: { id: product.id },
              data: {
                description: product.description,
                name: product.name,
                price: product.price,
                imagesUrl: product.imagesUrl,
              },
            });

        return updatedProduct;
      } catch (error) {
        throw new NotFoundException('Product not found');
      }
    }

    try {
      const repoUrls: Array<string> = req
        ? req['repoUrls']
          ? req['repoUrls']
          : await this.getUrls(product.id)
        : await this.getUrls(product.id);

      const updatedProduct = !product.imagesUrl
        ? await this.prismaService.product.update({
            where: { id: product.id },
            data: {
              description: product.description,
              name: product.name,
              price: product.price,
              imagesUrl: [...repoUrls, ...images],
            },
          })
        : await this.prismaService.product.update({
            where: { id: product.id },
            data: {
              description: product.description,
              name: product.name,
              price: product.price,
              imagesUrl: [...product.imagesUrl, ...images],
            },
          });

      return updatedProduct;
    } catch (e) {
      throw new NotFoundException('Product not found');
    }
  }

  async create(data: CreateProductDto, urls: Array<string>): Promise<Product> {
    const { description, name, price, supplierId, categories } = data;
    const supplier = await this.prismaService.supplier.findUnique({
      where: { id: supplierId },
    });

    const product = {
      description,
      name,
      price,
      supplierId: supplier.id,
      imagesUrl: urls,
      categories,
    };

    const createdProduct = await this.prismaService.product.create({
      data: product,
    });

    return createdProduct;
  }

  async findAll(supplierId: string = undefined): Promise<Array<Product>> {
    const products = await this.prismaService.product.findMany({
      where: {
        supplierId,
      },
    });

    return products;
  }

  async findProductById(id: string): Promise<Product> {
    const product = await this.prismaService.product.findUnique({
      where: { id },
    });
    return product;
  }

  async search(
    name?: string,
    category?: Category,
    rating?: number,
    productsLimit?: number,
    minPrice?: number,
    maxPrice?: number,
  ): Promise<Array<Product>> {
    if (category) {
      const products = await this.prismaService.product.findMany({
        where: {
          name: {
            contains: name,
          },
          categories: {
            has: category,
          },
          price: {
            gte: minPrice,
            lte: maxPrice,
          },
          rating: {
            gte: rating,
          },
        },
        take: productsLimit,
      });

      return products;
    }

    const products = await this.prismaService.product.findMany({
      where: {
        name: {
          contains: name,
        },
        price: {
          gte: minPrice,
          lte: maxPrice,
        },
        rating: {
          gte: rating,
        },
      },
      take: productsLimit,
    });

    return products;
  }

  async delete(id: string): Promise<null> {
    const product = await this.findProductById(id);

    try {
      product.imagesUrl.reduce((acc, url) => {
        this.fileService.deleteFile(url);
        return acc;
      }, []);
    } catch (e) {
      throw new NotFoundException('Product does not exists on database');
    }

    await this.prismaService.product.delete({ where: { id } });

    return;
  }

  async deleteAllImagesBySupplierId(supplierId: string): Promise<boolean> {
    const allProducts = await this.findAll(supplierId);
    try {
      allProducts.map((product) => {
        product.imagesUrl.reduce((acc, url) => {
          this.fileService.deleteFile(url);
          return acc;
        }, []);
      });

      return true;
    } catch (e) {
      return false;
    }
  }

  async getUrls(id: string): Promise<Array<string>> {
    const product = await this.findProductById(id);
    return product.imagesUrl;
  }

  async removeUrl(id: string, url: string | Array<string>): Promise<Product> {
    if (Array.isArray(url)) {
      url.map((img) => this.fileService.deleteFile(img));
      const product = await this.findProductById(id);
      const updatedProduct = await this.prismaService.product.update({
        where: { id },
        data: {
          imagesUrl: product.imagesUrl.filter((img) => !url.includes(img)),
        },
      });

      return updatedProduct;
    }

    this.fileService.deleteFile(url);
    const product = await this.findProductById(id);
    const updatedProduct = await this.prismaService.product.update({
      where: { id },
      data: {
        imagesUrl: product.imagesUrl.filter((img) => img !== url),
      },
    });

    return updatedProduct;
  }
}
