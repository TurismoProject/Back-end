import { PrismaService } from '@database/prisma/prisma.service';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { AbstractSupplierRepository } from './abstract-supplier.repository';
import { Supplier } from '@prisma/client';
import { CreateSupplierDto } from '@dtos/create-supplier.dto';
import { UpdateSupplierDto } from '@dtos/update-supplier.dto';
import { AbstractProductsRepository } from '@repositories/products/abstract-products.repository';

@Injectable()
export class SupplierRepository implements AbstractSupplierRepository {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly productRepository: AbstractProductsRepository,
  ) {}

  async create(data: CreateSupplierDto): Promise<Supplier> {
    const supplierExists = await this.getByEmail(data.email);

    if (supplierExists)
      throw new BadRequestException('Supplier already exists');

    return await this.prismaService.supplier.create({
      data,
    });
  }

  async getAll(): Promise<Array<Supplier>> {
    return await this.prismaService.supplier.findMany();
  }

  async getByUUID(uuid: string): Promise<Supplier> {
    return await this.prismaService.supplier.findUnique({
      where: { id: uuid },
    });
  }

  async getByEmail(email: string): Promise<Supplier> {
    return await this.prismaService.supplier.findUnique({
      where: { email },
    });
  }

  async update(data: UpdateSupplierDto): Promise<Supplier> {
    try {
      const updatedSupplier = await this.prismaService.supplier.update({
        where: { id: data.id },
        data: {
          address: data.address,
          email: data.email,
          companyName: data.companyName,
          password: data.password,
          phoneNumber: data.phoneNumber,
        },
      });
      return updatedSupplier;
    } catch (e) {
      throw new NotFoundException('Product does not exists on database');
    }
  }

  async delete(uuid: string): Promise<null> {
    const result =
      await this.productRepository.deleteAllImagesBySupplierId(uuid);

    if (!result)
      throw new InternalServerErrorException(
        "Error deleting supplier's images",
      );

    await this.prismaService.supplier.delete({ where: { id: uuid } });
    return;
  }
}
