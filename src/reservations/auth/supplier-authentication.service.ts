import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtTokenType, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../base/database/prisma/prisma.service';
import { AuthService } from '../../common/services/auth.service';

/**
 * Autentica fornecedores e controla a persistência e rotação de seus refresh tokens.
 */
@Injectable()
export class SupplierAuthenticationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService
  ) {}

  /**
   * Valida credenciais e emite tokens com um perfil público mínimo do fornecedor.
   *
   * Persiste o refresh token para permitir verificar sua validade na renovação.
   * @throws {UnauthorizedException} Se as credenciais ou o perfil forem inválidos.
   */
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

  /**
   * Consome o refresh token anterior e salva o substituto na mesma transação.
   *
   * @remarks
   * O delete condicionado a conta, tipo e expiração garante consumo único mesmo
   * em renovações simultâneas. Uma falha ao salvar o substituto reverte o consumo.
   * Não exige um access token válido, pois sua expiração é o motivo da renovação.
   * @throws {UnauthorizedException} Se a sessão estiver expirada, revogada ou já consumida.
   */
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
