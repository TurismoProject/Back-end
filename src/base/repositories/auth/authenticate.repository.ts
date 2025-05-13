import { PrismaService } from '@database/prisma/prisma.service';
import { AbstractAuthenticateRepository } from './abstract-authenticate.repository';
import { AuthModel } from '@common/models/auth.model';
import { AdminJWTs, SupplierJWTs, UserJWTs } from '@prisma/client';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthenticateRepository implements AbstractAuthenticateRepository {
  constructor(private readonly prismaService: PrismaService) { }

  async authenticateAdmin(authData: AuthModel): Promise<AdminJWTs> {
    const { authId, refreshToken, expirationDateRefreshToken } = authData;
    const expirationDate = new Date(Number(expirationDateRefreshToken) * 1000);

    const savedJWT = await this.prismaService.adminJWTs.create({
      data: {
        token: refreshToken,
        expiresAt: expirationDate,
        adminId: authId,
      },
    });
    return savedJWT;
  }

  async authenticateUser(authData: AuthModel): Promise<UserJWTs> {
    const { authId, refreshToken, expirationDateRefreshToken } = authData;
    const expirationDate = new Date(Number(expirationDateRefreshToken) * 1000);

    const savedJWT = await this.prismaService.userJWTs.create({
      data: {
        token: refreshToken,
        expiresAt: expirationDate,
        userId: authId,
      },
    });

    return savedJWT;
  }

  async authenticateSupplier(authData: AuthModel): Promise<SupplierJWTs> {
    const { authId, refreshToken, expirationDateRefreshToken } = authData;
    const expirationDate = new Date(expirationDateRefreshToken);

    const savedJWT = await this.prismaService.supplierJWTs.create({
      data: {
        token: refreshToken,
        expiresAt: expirationDate,
        supplierId: authId,
      },
    });
    return savedJWT;
  }

  async searchAdminJWT(jwt: string): Promise<AdminJWTs> {
    const adminJWT = await this.prismaService.adminJWTs.findUnique({
      where: { token: jwt },
    });
    return adminJWT;
  }

  async searchUserJWT(jwt: string): Promise<UserJWTs> {
    const userJWT = await this.prismaService.userJWTs.findUnique({
      where: { token: jwt },
    });
    return userJWT;
  }

  async searchSupplierJWT(jwt: string): Promise<SupplierJWTs> {
    const supplierJWT = await this.prismaService.supplierJWTs.findUnique({
      where: { token: jwt },
    });
    return supplierJWT;
  }

  async eraseAdminJWT(jwt: string): Promise<void> {
    await this.prismaService.adminJWTs.delete({
      where: { token: jwt },
    });
    return;
  }

  async eraseUserJWT(jwt: string): Promise<void> {
    await this.prismaService.userJWTs.delete({
      where: { token: jwt },
    });
    return;
  }

  async eraseSupplierJWT(jwt: string): Promise<void> {
    await this.prismaService.supplierJWTs.delete({
      where: { token: jwt },
    });
    return;
  }

  async refreshAdminJWT(oldJwt: string, newJwt: string): Promise<AdminJWTs> {
    const adminJWT = await this.prismaService.adminJWTs.update({
      where: { token: oldJwt },
      data: { token: newJwt },
    });

    return adminJWT;
  }

  async refreshUserJWT(oldJwt: string, newJwt: string): Promise<UserJWTs> {
    const userJWT = await this.prismaService.userJWTs.update({
      where: { token: oldJwt },
      data: { token: newJwt },
    });

    return userJWT;
  }

  async refreshSupplierJWT(
    oldJwt: string,
    newJwt: string
  ): Promise<SupplierJWTs> {
    const supplierJWT = await this.prismaService.supplierJWTs.update({
      where: { token: oldJwt },
      data: { token: newJwt },
    });

    return supplierJWT;
  }
}
