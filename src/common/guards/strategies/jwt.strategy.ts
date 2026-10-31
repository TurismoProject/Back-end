import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    const publicKey = configService.get<string>('JWT_PUBLIC_KEY', {
      infer: true,
    });
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: Buffer.from(publicKey, 'base64'),
      algorithms: ['RS256'],
    });
  }

  /**
   * Aceita somente access tokens nas rotas legadas protegidas por AuthGuard('jwt').
   *
   * @remarks
   * Passport já verificou assinatura e expiração antes deste método. O retorno mantém
   * o papel em maiúsculas por compatibilidade com o legado. O módulo de reservas usa
   * ReservationAccessGuard, que também consulta a conta e preserva o papel do Prisma.
   * @throws {UnauthorizedException} Se a finalidade ou os campos básicos forem inválidos.
   */
  async validate(payload: any) {
    if (
      payload.tokenUse !== 'access' ||
      !payload.sub ||
      typeof payload.role !== 'string'
    ) {
      throw new UnauthorizedException('Token de acesso inválido.');
    }
    const normalizedRole = payload.role.toUpperCase();

    return {
      userId: payload.sub,
      email: payload.email,
      role: normalizedRole,
    };
  }
}
