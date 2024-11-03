import { PrismaService } from '@base/database/prisma/prisma.service';
import { CreateUserDto } from '@dtos/create-user.dto';
import { UpdateUserDto } from '@dtos/update-user.dto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { User } from '@prisma/client';
import { AbstractUserRepository } from './abstract-user.repository';

@Injectable()
export class UserRepository implements AbstractUserRepository {
  // eslint-disable-next-line prettier/prettier
  constructor(private prismaService: PrismaService) { }
  // eslint-disable-next-line prettier/prettier
  async findFirstUser({ email, cpf }: { email?: string; cpf?: string }): Promise<User> {
    try {
      const existingUser = await this.prismaService.user.findFirst({
        where: {
          OR: [
            email ? { email } : undefined,
            cpf ? { cpf } : undefined,
          ],
        },
      });
      return existingUser;
    } catch (error) {
      throw new Error(
        `Não foi possível verificar se o usuário já existe: ${error.message}`,
      );
    }
  }

  async create(user: CreateUserDto): Promise<User> {
    const userExists = await this.findFirstUser({
      email: user.email,
      cpf: user.cpf,
    });
  
    await this.validateBirthDate(user.birthday);
  
    if (userExists) {
      throw new ConflictException('Usuário já existe');
    }
  
    const UserData = {
      ...user,
      birthday: new Date(user.birthday).toISOString().split('T')[0],
    };

    try {
      const createdUser = await this.prismaService.user.create({
        data: UserData,
      });
      return createdUser;
    } catch (error) {
      throw new BadRequestException(`Erro ao criar o usuário: ${error.message}`);
    }
  }
  

  private async validateBirthDate(birthDate: string): Promise<boolean> {
    const date = new Date(birthDate);
    let validateBirthUser = true;

    if (isNaN(date.getTime())) {
      validateBirthUser = false;
      throw new BadRequestException('data de nascimento inválida');
    }
    const age = await this.calculateAge(date);
    if (age < 18) {
      validateBirthUser = false;
      throw new BadRequestException('O usuário deve ter pelo menos 18 anos para se cadastrar!');
    }
    return Promise.resolve(validateBirthUser);
  }

  private async calculateAge(birthDate: Date): Promise<number> {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    // eslint-disable-next-line prettier/prettier
    const validBirth = monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate());
    // eslint-disable-next-line prettier/prettier
    if (validBirth) {
      age--;
    }
    return age;
  }

  async findAll(): Promise<User[]> {
    try {
        return await this.prismaService.user.findMany();
    } catch (error) {
        throw new Error(`Não foi possível buscar os usuários: ${error.message}`);
    }
}

  async findById(id: string): Promise<User> {

    const user = await this.prismaService.user.findUnique({
        where: { id },
    });
    return user;
  }

  async updateUser(id: string, UserData: UpdateUserDto): Promise<User> {
    const existingUser = await this.userExists(id);

    if (existingUser) {
        try {
            const updatedUser = await this.prismaService.user.update({
                where: { id: id },
                data: UserData,
            });
            return updatedUser;
        } catch (error) {
            throw new BadRequestException(`Erro ao atualizar o cliente: ${error.message}`);
        }
    }
}

async deleteUser(id: string): Promise<User> {
  const existingUser = await this.userExists(id);
  if (existingUser) {
      try {
          const deleteUser = await this.prismaService.user.delete({ where: { id: id } });
          return deleteUser;
      } catch (error) {
          throw new BadRequestException(`Erro ao deletar o cliente: ${error.message}`);
      }
  }
}
  async userExists(id: string): Promise<boolean> {
    let validExistUser = false;
    const userStatus = await this.findById(id);

    if (userStatus) {
      validExistUser = true;
    } else {
      throw new NotFoundException(`Usuário não existe`);
    }
    return validExistUser;
  }
}
