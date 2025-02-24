import { PrismaService } from '@database/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Injectable } from '@nestjs/common';
import { AbstractUserRepository } from '@repositories/user/abstract-user.repository';
import { AbstractAdminRepository } from '@repositories/admin/abstract-admin.repository';

import { AuthModel } from '@common/models/auth.model';
import { Role } from '@common/enums/role.enum';
import { Admin, User } from '@prisma/client';

@Injectable()
export class AuthService {

  private static readonly errorMessage: string = 'Email e/ou senha inválidos';

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly userRepository: AbstractUserRepository,
    private readonly adminRepository: AbstractAdminRepository,
    // private supplierService: AbstractSupplierRepository
  ) { }

  private generateJwtToken(
    user: any,
    expiration: string = '15m'
  ) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role?.name,
    };

    const token = this.jwtService.sign(payload, { expiresIn: expiration });
    return token;
  }
  private async generateUserRefreshToken(user: User, expiration: string = '7d'): Promise<string> {
    const token = this.generateJwtToken(user, expiration);
    const expirationDays = parseInt(expiration.replace(/\D/g, ''));

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);

    try {
      await this.prisma.authenticate.upsert({
        where: { accountId: user.id },
        update: {
          token,
          expiresAt,
        },
        create: {
          token,
          accountId: user.id,
          type: user.role,
          expiresAt,
        },
      });
      return token;

    } catch (error) {
      console.error('Erro ao gerar refresh token para usuário:', error);
      throw new Error('Erro ao gerar refresh token');
    }
  }
  private async generateAdminRefreshToken(admin: Admin, expiration: string = '7d'): Promise<string> {
    const token = this.generateJwtToken(admin, expiration);
    const expirationDays = parseInt(expiration.replace(/\D/g, ''));

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);

    try {
      await this.prisma.authenticate.upsert({
        where: { accountId: admin.id },
        update: {
          token,
          type: admin.role,
          expiresAt,
        },
        create: {
          token,
          type: admin.role,
          accountId: admin.id,
          expiresAt,
        },
      });
      return token;

    } catch (error) {
      console.error('Erro ao gerar refresh token para admin:', error);
      throw new Error('Erro ao gerar refresh token');
    }
  }

  // private async generateSupplierRefreshToken(user: Supplier, expiration: string = '7d'): Promise<string> {
  //   const token = this.generateJwtToken(user, expiration);
  //   const expirationDays = parseInt(expiration.replace(/\D/g, ''));

  //   if (isNaN(expirationDays) || expirationDays <= 0) {
  //     throw new Error('A expiração fornecida não é válida.');
  //   }

  //   const expiresAt = new Date();
  //   expiresAt.setDate(expiresAt.getDate() + expirationDays);

  //   try {
  //     await this.prisma.authenticate.upsert({
  //       where: { entityId: user.id },
  //       update: {
  //         token,
  //         expiresAt,
  //       },
  //       create: {
  //         token,
  //         entityId: user.id,
  //         expiresAt,
  //       },
  //     });
  //     return token;

  //   } catch (error) {
  //     console.error('Erro ao gerar refresh token para fornecedor:', error);
  //     throw new Error('Erro ao gerar refresh token');
  //   }
  // }

  public async generateTokens(user: any): Promise<AuthModel> {
    const accessToken = await this.generateJwtToken(user, '15m');
    const refreshToken = await this.generateRoleBasedRefreshToken(user);

    const tokens: AuthModel = {
      accessToken: accessToken,
      refreshToken: refreshToken,
    };

    return tokens;
  }

  async validateUser(email: string, password: string): Promise<User> {
    const findedUser = await this.userRepository.findByEmail(email);
    if (!findedUser) {
      throw new Error(AuthService.errorMessage);
    }
    const isValidUser = await bcrypt.compare(password, findedUser.password);
    if (!isValidUser) {
      throw new Error(AuthService.errorMessage);
    }
    return findedUser;
  }

  async validateAdmin(email: string, password: string): Promise<any> {
    const findedAdmin = await this.adminRepository.findByEmail(email);
    if (!findedAdmin) {
      throw new Error(AuthService.errorMessage);
    }

    const isValidAdmin = await bcrypt.compare(password, findedAdmin.password);

    if (!isValidAdmin) {
      throw new Error(AuthService.errorMessage);
    }
    return findedAdmin;
  }

  private async generateRoleBasedRefreshToken(user: any): Promise<string> {
    switch (user.role.toLowerCase()) {
      case Role.USER:
        const refreshTokenUserAuth = await this.generateUserRefreshToken(user);
        return refreshTokenUserAuth;
      case Role.ADMIN:
        const refreshTokenAdminAuth = await this.generateAdminRefreshToken(user);
        return refreshTokenAdminAuth;
      // case Role.SUPPLIER:
      //   const RefreshTokenSupplierAuth = await this.generateSupplierRefreshToken(user);
      //   return RefreshTokenSupplierAuth;
      default:
        throw new Error('Tipo de usuário inválido');
    }
  }
}
