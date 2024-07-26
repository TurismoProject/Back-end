import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import UserCliente from './user.entity';

@Injectable()
export class UserRepository {
  constructor(private prismaService: PrismaService) {}

  async findAll() {
    return this.prismaService.cliente.findMany();
  }

  async findUserById(id: number) {
    return this.prismaService.cliente.findUnique({ where: { id } });
  }

  async create(user: UserCliente) {
    return this.prismaService.cliente.create({ data: user });
  }

  async update(user: UserCliente) {
    try {
      return this.prismaService.cliente.update({
        where: { id: user.id },
        data: user as any,
      });
    } catch (error) {
      throw error;
    }
  }

  async delete(id: number) {
    return this.prismaService.cliente.delete({ where: { id } });
  }
}
