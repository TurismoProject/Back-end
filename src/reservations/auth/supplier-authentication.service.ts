import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtTokenType, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../base/database/prisma/prisma.service';
import { AuthService } from '../../common/services/auth.service';

@Injectable()
export class SupplierAuthenticationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService
  ) {}

  async login(email: string, password: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { email },
    });
    if (
      !supplier ||
      supplier.role !== Role.Supplier ||
      !(await bcrypt.compare(password, supplier.password))
    ) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }
    const tokens = this.auth.generateTokens(supplier);
    await this.prisma.supplierJWTs.create({
      data: {
        supplierId: supplier.id,
        token: tokens.refreshToken,
        expiresAt: new Date(tokens.expirationDateRefreshToken * 1000),
      },
    });
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      supplier: { id: supplier.id, name: supplier.name, email: supplier.email },
    };
  }

  async refresh(refreshToken: string) {
    const payload = this.auth.validateRefreshToken(refreshToken);
    if (payload.role !== Role.Supplier)
      throw new UnauthorizedException('Token inválido.');
    return this.prisma.$transaction(async (tx) => {
      const supplier = await tx.supplier.findUnique({
        where: { id: payload.sub },
      });
      if (!supplier || supplier.role !== Role.Supplier)
        throw new UnauthorizedException('Conta não encontrada.');
      const consumed = await tx.supplierJWTs.deleteMany({
        where: {
          token: refreshToken,
          supplierId: supplier.id,
          type: JwtTokenType.acess,
          expiresAt: { gt: new Date() },
        },
      });
      if (consumed.count !== 1)
        throw new UnauthorizedException('Sessão expirada ou revogada.');
      const tokens = this.auth.generateTokens(supplier);
      await tx.supplierJWTs.create({
        data: {
          supplierId: supplier.id,
          token: tokens.refreshToken,
          expiresAt: new Date(tokens.expirationDateRefreshToken * 1000),
        },
      });
      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    });
  }
}
