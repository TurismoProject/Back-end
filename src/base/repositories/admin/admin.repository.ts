import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { AbstractAdminRepository } from './abstract-admin.repository';
import { CreateAdminDto } from '@dtos/create-admin.dto';
import { UpdateAdminDto } from '@dtos/update-admin.dto';
import { Admin } from '@prisma/client';
import { PrismaService } from '@database/prisma/prisma.service';

@Injectable()
export class AdminRepository implements AbstractAdminRepository {
  constructor(private prismaService: PrismaService) {}

  async createAdmin(userAdmin: CreateAdminDto): Promise<Admin> {
    const adminExists = this.findFirstUser({
      email: userAdmin.email,
      name: userAdmin.name,
    });

    if (adminExists) {
      try {
        const adminCreate = await this.prismaService.admin.create({
          data: userAdmin,
        });
        return adminCreate;
      } catch (error) {
        throw new BadRequestException(
          `Erro ao criar o admin: ${error.message}`
        );
      }
    }

    return;
  }

  async findAll(): Promise<Admin[]> {
    try {
      const usersAdmin = await this.prismaService.admin.findMany({
        where: {
          role: 'Admin',
        },
      });
      return usersAdmin;
    } catch (error) {
      throw new BadRequestException(
        `Não foi possível buscar os usuários administradores: ${error.message}`
      );
    }
  }

  async findById(id: string): Promise<Admin> {
    const userAdmin = await this.prismaService.admin.findUnique({
      where: {
        id,
        role: 'Admin',
      },
    });

    if (!userAdmin) {
      throw new NotFoundException(
        `Usuário administrador não encontrado na base de dados`
      );
    }

    return userAdmin;
  }

  private async findFirstUser({
    email,
    name,
  }: {
    email?: string;
    name?: string;
  }): Promise<Admin> {
    try {
      const existingUser = await this.prismaService.user.findFirst({
        where: {
          OR: [email ? { email } : undefined, name ? { name } : undefined],
        },
      });
      return existingUser;
    } catch (error) {
      throw new Error(
        `Não foi possível verificar se o usuário já existe: ${error.message}`
      );
    }
  }

  private async userExists(id: string): Promise<boolean> {
    let validExistUser = false;
    const userStatus = await this.findById(id);

    if (userStatus) {
      validExistUser = true;
    }
    return validExistUser;
  }

  async updateAdmin(id: string, updateAdmin: UpdateAdminDto): Promise<Admin> {
    const existAdmin = await this.userExists(id);

    if (existAdmin) {
      try {
        const updatedAdmin = await this.prismaService.admin.update({
          where: { id: id },
          data: updateAdmin,
        });
        return updatedAdmin;
      } catch (error) {
        throw new InternalServerErrorException(
          `Erro ao atualizar Informações ${error.message}`
        );
      }
    }
  }

  async deleteAdmin(id: string): Promise<Admin> {
    const findedAdmin = await this.userExists(id);
    if (findedAdmin) {
      const deletedAdmin = await this.prismaService.admin.delete({
        where: { id },
      });
      return deletedAdmin;
    }
  }
}
