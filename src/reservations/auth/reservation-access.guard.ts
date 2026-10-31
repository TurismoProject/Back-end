import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { isUUID } from 'class-validator';
import { PrismaService } from '../../base/database/prisma/prisma.service';
import { ReservationActor } from './reservation-actor';

const RESERVATION_ROLE = 'reservation-role';
/**
 * Declara o perfil exigido pelo ReservationAccessGuard na classe ou no handler.
 * @remarks O decorator define metadados; a aplicação da restrição depende do guard.
 */
export const ReservationRole = (role: Extract<Role, 'User' | 'Supplier'>) =>
  SetMetadata(RESERVATION_ROLE, role);

/**
 * Autentica o acesso às reservas e às operações relacionadas do fornecedor/usuário.
 *
 * Confere assinatura RS256, finalidade do token, perfil exigido e conta no banco.
 * Não substitui a verificação de propriedade de cada saída/reserva nos services.
 */
@Injectable()
export class ReservationAccessGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector
  ) {}

  /**
   * Valida a sessão e disponibiliza uma ReservationActor verificada na requisição.
   *
   * @remarks
   * Refresh tokens e tokens antigos sem tokenUse não são aceitos. A busca usa a tabela
   * do perfil exigido, impedindo que um ID de usuário seja tratado como fornecedor.
   * @throws {UnauthorizedException} Se o token ou a conta forem inválidos.
   * @throws {ForbiddenException} Se o perfil do token não for o exigido pela rota.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const match = /^Bearer ([^ ]+)$/i.exec(request.headers.authorization ?? '');
    if (!match) throw new UnauthorizedException('Token de acesso obrigatório.');

    let payload: { sub: string; role: Role; tokenUse: string };
    try {
      payload = this.jwt.verify(match[1], { algorithms: ['RS256'] });
      if (payload.tokenUse !== 'access' || !isUUID(payload.sub))
        throw new Error();
    } catch {
      throw new UnauthorizedException('Token de acesso inválido ou expirado.');
    }

    const role = this.reflector.getAllAndOverride<Role>(RESERVATION_ROLE, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (payload.role !== role)
      throw new ForbiddenException('Perfil sem permissão.');

    const select = { id: true, name: true, role: true } as const;
    const account =
      role === Role.Supplier
        ? await this.prisma.supplier.findUnique({
            where: { id: payload.sub },
            select,
          })
        : await this.prisma.user.findUnique({
            where: { id: payload.sub },
            select,
          });
    if (!account || account.role !== role) {
      throw new UnauthorizedException(
        'Conta não encontrada ou perfil inválido.'
      );
    }
    request.reservationActor = account as ReservationActor;
    return true;
  }
}
