import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { ClientUserDto } from './dto/client.dto';
import Client from './client.entity';

@Injectable()
export class ClientService {
  constructor(private prismaService: PrismaService) {}

  async create(client: ClientUserDto) {
    return this.prismaService.cliente.create({ data: client });
  }
  async findAll() {
    return this.prismaService.cliente.findMany();
  }

  async findUserById(id: number) {
    return this.prismaService.cliente.findUnique({ where: { id } });
  }

  async update(client: Client) {
    try {
      return this.prismaService.cliente.update({
        where: { id: client.id },
        data: client as any,
      });
    } catch (error) {
      throw error;
    }
  }

  async delete(id: number) {
    return this.prismaService.cliente.delete({ where: { id } });
  }
}
