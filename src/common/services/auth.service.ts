import { JwtService } from '@nestjs/jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { AuthModel } from '@common/models/auth.model';
import { randomBytes, randomUUID } from 'crypto';

/**
 * Dados mínimos da conta usados na emissão de tokens, sem senha nem campos pessoais extras.
 */
type TokenIdentity = Pick<User, 'id' | 'email' | 'role'>;
/**
 * Payload compartilhado; tokenUse distingue acesso de renovação de sessão.
 */
interface TokenClaims {
  sub: string;
  email: string;
  role: Role;
  tokenUse: 'access' | 'refresh';
}

/**
 * Emite e valida tokens compartilhados pelos perfis da aplicação.
 *
 * @remarks
 * Validação criptográfica não comprova que a conta ainda exista nem que um refresh
 * token continue registrado. Essas verificações pertencem ao guard ou ao fluxo
 * de renovação da conta. Access tokens são stateless e expiram em 15 minutos.
 */
@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * Emite access token de 15 minutos e refresh token de 7 dias, com identificadores distintos.
   * @returns Tokens e expiração do refresh em segundos Unix, para persistência da sessão.
   */
  public generateTokens(user: TokenIdentity): AuthModel {
    const access = this.generateJwtToken(user, 'access', 15 * 60);
    const refresh = this.generateJwtToken(user, 'refresh', 7 * 24 * 60 * 60);
    return {
      accessToken: access.token,
      refreshToken: refresh.token,
      expirationDateRefreshToken: refresh.exp,
    };
  }

  /**
   * Emite novo acesso preservando o subject da conta identificada pelo refresh token.
   *
   * @remarks O chamador deve consultar a sessão persistida antes de aceitar a renovação.
   * @throws {UnauthorizedException} Se o token não for um refresh válido.
   */
  public regenerateAccessToken(refreshToken: string) {
    const payload = this.validateRefreshToken(refreshToken);
    return this.generateJwtToken(
      { id: payload.sub, email: payload.email, role: payload.role },
      'access',
      15 * 60
    );
  }

  /**
   * Verifica assinatura, expiração e finalidade de renovação; não consulta a sessão no banco.
   * @throws {UnauthorizedException} Se o token for inválido ou destinado a acesso.
   */
  public validateRefreshToken(token: string): TokenClaims {
    return this.verifyToken(token, 'refresh');
  }

  /**
   * Verifica assinatura, expiração e finalidade de acesso; não consulta a conta no banco.
   * @throws {UnauthorizedException} Se o token for inválido ou destinado a renovação.
   */
  public validateAccessToken(token: string): TokenClaims {
    return this.verifyToken(token, 'access');
  }

  /**
   * Restringe a validação a RS256, perfil reconhecido e finalidade esperada.
   */
  private verifyToken(
    token: string,
    tokenUse: TokenClaims['tokenUse']
  ): TokenClaims {
    try {
      const payload = this.jwtService.verify<TokenClaims>(token, {
        algorithms: ['RS256'],
      });
      if (
        payload.tokenUse !== tokenUse ||
        !payload.sub ||
        !Object.values(Role).includes(payload.role)
      )
        throw new Error();
      return payload;
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado.');
    }
  }

  /**
   * Gera um segredo aleatório de recuperação, sem dados da conta, válido por 30 minutos.
   *
   * @remarks O fluxo chamador associa e persiste o segredo à conta e envia o link.
   * @param _user Mantido por compatibilidade com os chamadores; não compõe o segredo.
   */
  public generateResetToken(_user: TokenIdentity) {
    return {
      token: randomBytes(32).toString('hex'),
      exp: new Date(Date.now() + 30 * 60 * 1000),
    };
  }

  /**
   * Assina identidade e finalidade com um jti aleatório para distinguir emissões simultâneas.
   * @param expiresIn Validade em segundos, aplicada pelo serviço JWT.
   */
  private generateJwtToken(
    user: TokenIdentity,
    tokenUse: TokenClaims['tokenUse'],
    expiresIn: number
  ) {
    const token = this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role, tokenUse },
      {
        expiresIn,
        jwtid: randomUUID(),
      }
    );
    const { exp } = this.jwtService.decode(token) as { exp: number };
    return { token, exp };
  }
}
