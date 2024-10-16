import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@base/database/prisma/prisma.service';
import { CreateUserDto } from '@dtos/create-user.dto';
import { UpdateUserDto } from '@dtos/update-user.dto';
import { AbstractUserRepository } from './abstract-user.repository';

@Injectable()
export class UserRepository implements AbstractUserRepository {
  constructor(private prismaService: PrismaService) {}

  async create(user: CreateUserDto) {
    const userExists = await this.prismaService.usuario.findFirst({
      where: { cpf: user.cpf },
    });
    if (userExists) {
      throw new ConflictException('User already exists');
    }
    const dataNascimento = new Date(user.dataNascimento);
    const dataAtual = new Date();
    const idade = dataAtual.getFullYear() - dataNascimento.getFullYear();
    if (idade < 18) {
      throw new BadRequestException('User must be at least 18 years old');
    }
    user.dataNascimento = dataNascimento.toISOString().split('T')[0];
    return this.prismaService.usuario.create({ data: user });
  }

  async findAll() {
    return this.prismaService.usuario.findMany();
  }

  async findUserById(id: number) {
    return this.prismaService.usuario.findUnique({ where: { id } });
  }

  async findUserUniqueCpf(cpf: string) {
    return this.prismaService.usuario.findFirstOrThrow({ where: { cpf } });
  }

  async update(user: UpdateUserDto) {
    await this.userExists(user.id);
    try {
      return this.prismaService.usuario.update({
        where: { id: user.id },
        data: user as any,
      });
    } catch (error) {
      throw error;
    }
  }

  async delete(id: number) {
    await this.userExists(id);
    return this.prismaService.usuario.delete({ where: { id } });
  }

  async userExists(id: number) {
    if (!(await this.findUserById(id))) {
      throw new NotFoundException(`User ${id} não foi encontrado`);
    }
  }
}
