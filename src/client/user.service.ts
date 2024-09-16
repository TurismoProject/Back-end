import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private prismaService: PrismaService) { }

  async create(user: CreateUserDto) {
    const userExists = await this.prismaService.user.findFirst({
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
    return this.prismaService.user.create({ data: user });
  }

  async findAll() {
    return this.prismaService.user.findMany();
  }

  async findUserById(id: number) {
    return this.prismaService.user.findUnique({ where: { id } });
  }

  async findUserUniqueCpf(cpf: string) {
    return this.prismaService.user.findFirstOrThrow({ where: { cpf } });
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
