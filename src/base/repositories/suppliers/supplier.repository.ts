import { PrismaService } from '@database/prisma/prisma.service';
import {
  BadRequestException,
  ConflictException,
  Logger,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AbstractSupplierRepository } from './abstract-supplier.repository';
import { Prisma, Supplier } from '@prisma/client';
import { CreateSupplierDto } from '@dtos/create-supplier.dto';
import { UpdateSupplierDto } from '@dtos/update-supplier.dto';
import { FileService } from '@services/file.service';

@Injectable()
export class SupplierRepository implements AbstractSupplierRepository {
  private readonly logger = new Logger(SupplierRepository.name);
  constructor(
    private readonly prismaService: PrismaService,
    private readonly fileService: FileService
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
          name: data.name,
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
    let urls: string[];
    try {
      urls = await this.prismaService.$transaction(async (tx) => {
        const supplier = await tx.supplier.findUnique({
          where: { id: uuid },
          include: { products: { select: { imagesUrl: true } } },
        });
        if (!supplier)
          throw new NotFoundException('Fornecedor não encontrado.');
        // Delete first: historical departures must block removal before touching storage.
        await tx.supplier.delete({ where: { id: uuid } });
        return supplier.products.flatMap((product) => product.imagesUrl);
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new ConflictException(
          'O fornecedor possui saídas cadastradas e seu histórico deve ser preservado.'
        );
      }
      throw error;
    }
    const results = await Promise.allSettled(
      urls.map((url) => this.fileService.deleteFile(url))
    );
    if (results.some((result) => result.status === 'rejected')) {
      this.logger.warn(
        `Falha ao remover imagens do fornecedor excluído ${uuid}.`
      );
    }
    return null;
  }
}
