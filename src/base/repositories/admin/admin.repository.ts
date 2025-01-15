import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
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
    @Inject(forwardRef(() => AuthService))
    private readonly AuthService: AuthService,
  ) { }

  async createAdmin(userAdmin: CreateAdminDto): Promise<UserAuthentication> {
    const adminExists = await this.findFirstAdmin({
      email: userAdmin.email,
      name: userAdmin.name,
    });

    if (adminExists) {
      throw new ConflictException('Usuário já existe');
    }

    try {
      const adminCreate = await this.prismaService.admin.create({
        data: userAdmin,
      });
      const token = await this.AuthService.generateTokens(adminCreate);
      const authData: AuthModel = {
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
      };

      const admin = {
        id: adminCreate.id,
        email: adminCreate.email,
        name: adminCreate.name,
        password: adminCreate.password,
      }
      const createAdminAndAuthenticate: UserAuthentication = {
        user: admin,
        autheticate: authData,
      };

      return createAdminAndAuthenticate;

    } catch (error) {
      throw new BadRequestException(
        `Erro ao criar o admin: ${error.message}`,
      );
    }
  }

  async login(email: string, password: string): Promise<AuthModel> {

    const isValidUser = await this.AuthService.validateAdmin(
      email,
      password
    );

    const token = await this.AuthService.generateTokens(isValidUser);

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
    const admin = await this.prismaService.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return admin;
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

  private async findFirstAdmin({
    email,
    name,
  }: {
    email?: string;
    name?: string;
  }): Promise<Admin | null> {
    try {
      const existingAdmin = await this.prismaService.admin.findFirst({
        where: {
          OR: [
            email ? { email } : undefined,
            name ? { name } : undefined
          ],
        },
      });
      return existingAdmin;
    } catch (error) {
      throw new Error(
        `Não foi possível verificar se o administrador já existe: ${error.message}`
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
