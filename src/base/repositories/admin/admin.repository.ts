import * as bcrypt from 'bcrypt';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AbstractAdminRepository } from './abstract-admin.repository';
import { CreateAdminDto } from '@dtos/create-admin.dto';
import { UpdateAdminDto } from '@dtos/update-admin.dto';
import { Admin } from '@prisma/client';
import { PrismaService } from '@database/prisma/prisma.service';
import { AuthModel } from '@common/models/auth.model';
import { AuthService } from '@services/auth.service';
import { UserAuthentication } from '@common/models/user-authenticate.model';

@Injectable()
export class AdminRepository implements AbstractAdminRepository {
  constructor(
    private prismaService: PrismaService,
    private readonly authService: AuthService
  ) {}

  async create(userAdmin: CreateAdminDto): Promise<UserAuthentication> {
    try {
      const adminCreate = await this.prismaService.admin.create({
        data: userAdmin,
      });
      const token = await this.authService.generateTokens(adminCreate);
      const authData: AuthModel = {
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
      };

      const admin = {
        id: adminCreate.id,
        email: adminCreate.email,
        name: adminCreate.name,
        password: adminCreate.password,
      };
      const createAdminAndAuthenticate: UserAuthentication = {
        user: admin,
        autheticate: authData,
      };

      return createAdminAndAuthenticate;
    } catch (error) {
      throw new InternalServerErrorException(
        `Erro ao criar o admin: ${error.message}`
      );
    }
  }

  async login(email: string, password: string): Promise<AuthModel> {
    const isValidUser = await this.validateAdmin(email, password);

    const token = await this.authService.generateTokens(isValidUser);

    const authData: AuthModel = {
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
    };

    return authData;
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

  async findByEmail(email: string): Promise<Admin> {
    try {
      const admin = await this.prismaService.admin.findUnique({
        where: { email },
      });

      return admin;
    } catch (e) {
      throw new NotFoundException('Usuário não encontrado');
    }
  }

  async findById(id: string): Promise<Admin> {
    try {
      const userAdmin = await this.prismaService.admin.findUnique({
        where: {
          id,
          role: 'Admin',
        },
      });

      return userAdmin;
    } catch (e) {
      throw new NotFoundException(
        `Usuário administrador não encontrado na base de dados`
      );
    }
  }

  async updateAdmin(id: string, updateAdmin: UpdateAdminDto): Promise<Admin> {
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

  async deleteAdmin(id: string): Promise<Admin> {
    try {
      const deletedAdmin = await this.prismaService.admin.delete({
        where: { id },
      });
      return deletedAdmin;
    } catch (e) {
      throw new NotFoundException('Admin não existe');
    }
  }

  private async validateAdmin(email: string, password: string): Promise<any> {
    const findedAdmin = await this.findByEmail(email);
    if (!findedAdmin) {
      throw new UnauthorizedException('Email e/ou senha inválidos');
    }

    const isValidAdmin = await bcrypt.compare(password, findedAdmin.password);

    if (!isValidAdmin) {
      throw new UnauthorizedException('Email e/ou senha inválidos');
    }
    return findedAdmin;
  }
}
