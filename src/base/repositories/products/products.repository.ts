import { Injectable, NotFoundException } from '@nestjs/common';
import { AbstractProductsRepository } from './abstract-products.repository';
import { PrismaService } from '@database/prisma/prisma.service';
import { Product } from '@prisma/client';
import { CreateProductDto } from '@dtos/create-product.dto';
import { UpdateProductDto } from '@dtos/update-product.dto';
import { FileService } from '@services/file.service';

@Injectable()
export class ProductsRepository implements AbstractProductsRepository {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly fileService: FileService
  ) {}

  async create(data: CreateProductDto, urls: Array<string>): Promise<Product> {
    const { description, name, price, supplierId } = data;
    const supplier = await this.prismaService.supplier.findUnique({
      where: { id: supplierId },
    });

    const product = {
      description,
      name,
      price,
      supplierId: supplier.id,
      imagesUrl: urls,
    };

    const createdProduct = await this.prismaService.product.create({
      data: product,
    });

    return createdProduct;
  }

  async findAll(supplierId: string = undefined): Promise<Array<Product>> {
    if (!supplierId) {
      const products = await this.prismaService.product.findMany();

      return products;
    }

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

  async update(data: UpdateProductDto): Promise<Product> {
    try {
      const updatedProduct = await this.prismaService.product.update({
        where: { id: data.id },
        data: {
          description: data.description,
          name: data.name,
          price: data.price,
        },
      });

      return updatedProduct;
    } catch (error) {
      throw new NotFoundException('Product not found');
    }
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
}