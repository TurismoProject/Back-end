import { Injectable } from '@nestjs/common';
import { AbstractProductsRepository } from './abstract-products.repository';
import { PrismaService } from '@database/prisma/prisma.service';
import { Produto } from '@prisma/client';

@Injectable()
export class ProductsRepository implements AbstractProductsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(data: Produto): Promise<Produto> {
    const product = await this.prismaService.produto.create({ data });

    return product;
  }

  async findAll(): Promise<Array<Produto>> {
    const products = await this.prismaService.produto.findMany();

    return products;
  }

  async findProductById(id: number): Promise<Produto> {
    const product = await this.prismaService.produto.findUnique({
      where: { id },
    });

    return product;
  }

  async update(data: any): Promise<Produto> {
    const product = await this.prismaService.produto.update({
      where: { id: data.id },
      data,
    });

    return product;
  }

  async delete(id: number): Promise<null> {
    await this.prismaService.produto.delete({ where: { id } });

    return;
  }
}
