import { PrismaService } from '@database/prisma/prisma.service';
import { AbstractAuthenticateRepository } from './abstract-authenticate.repository';
import { AuthModel } from '@common/models/auth.model';
import { AuthToken, Role } from '@prisma/client';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthenticateRepository implements AbstractAuthenticateRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async authenticate(authData: AuthModel, role: Role): Promise<AuthToken> {
    const { authId, refreshToken, expirationDateRefreshToken } = authData;
    const expirationDate = new Date(Number(expirationDateRefreshToken) * 1000);

    const savedJWT = await this.prismaService.authToken.create({
      data: {
        token: refreshToken,
        expiresAt: expirationDate,
        userId: authId,
        userType: role,
      },
    });

    return savedJWT;
  }

  async searchJwt(jwt: string): Promise<AuthToken> {
    const token = await this.prismaService.authToken.findUnique({
      where: { token: jwt },
    });

    return token;
  }

  async validateJwt(token: string): Promise<boolean> {
    const authToken = await this.searchJwt(token);
    if (!authToken) return false;

    if (authToken.expiresAt < new Date()) {
      await this.eraseJwt(token);
      return false;
    }

    return true;
  }

  async eraseJwt(jwt: string): Promise<void> {
    await this.prismaService.authToken.delete({
      where: { token: jwt },
    });

    return;
  }

  async refreshJwt(oldJwt: string, newJwt: string): Promise<AuthToken> {
    const token = await this.prismaService.authToken.update({
      where: {
        token: oldJwt,
      },
      data: { token: newJwt },
    });

    return token;
  }
}
