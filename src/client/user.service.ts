import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private prismaService: PrismaService) {}

  async create(user: CreateUserDto) {
    return this.prismaService.user.create({ data: user });
  }
  async findAll() {
    return this.prismaService.user.findMany();
  }

  async findUserById(id: number) {
    return this.prismaService.user.findUnique({ where: { id } });
  }

  async update(user: UpdateUserDto) {
    await this.userExists(user.id);
    try {
      return this.prismaService.user.update({
        where: { id: user.id },
        data: user as any,
      });
    } catch (error) {
      throw error;
    }
  }

  async delete(id: number) {
    await this.userExists(id);
    return this.prismaService.user.delete({ where: { id } });
  }

  async userExists(id: number) {
    if (!(await this.findUserById(id))) {
      throw new NotFoundException(`User ${id} não foi encontrado`);
    }
  }
}
