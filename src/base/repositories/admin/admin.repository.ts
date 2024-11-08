import {
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
    return;
  }

  async findAll(): Promise<Admin[]> {
    try {
      const usersAdmin = await this.prismaService.admin.findMany({
        where: {
          role: 'admin',
        },
      });
      return usersAdmin;
    } catch (error) {
      throw new InternalServerErrorException(
        `Não foi possível buscar os usuários administradores: ${error.message}`
      );
    }
  }

  async findById(id: string): Promise<Admin> {
    const userAdmin = await this.prismaService.admin.findUnique({
      where: {
        id,
        role: 'admin',
      },
    });

    if (!userAdmin) {
      throw new NotFoundException(
        `Usuário administrador não encontrado na base de dados`
      );
    }

    return userAdmin;
  }

  private async userExists(id: string): Promise<boolean> {
    let validExistUser = false;
    const userStatus = await this.findById(id);

    if (userStatus) {
      validExistUser = true;
    }
    return validExistUser;
  }

  findFirstUser({
    email,
    name,
  }: {
    email?: string;
    name?: string;
  }): Promise<Admin> {
    return;
  }

  updateAdmin(id: string, userAdmin: UpdateAdminDto): Promise<Admin> {
    return;
  }

  deleteAdmin(id: string): Promise<Admin> {
    return;
  }
}
