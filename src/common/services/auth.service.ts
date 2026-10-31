import { JwtService } from '@nestjs/jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { AuthModel } from '@common/models/auth.model';
import { randomBytes, randomUUID } from 'crypto';

type TokenIdentity = Pick<User, 'id' | 'email' | 'role'>;
interface TokenClaims {
  sub: string;
  email: string;
  role: Role;
  tokenUse: 'access' | 'refresh';
}

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  public generateTokens(user: TokenIdentity): AuthModel {
    const access = this.generateJwtToken(user, 'access', 15 * 60);
    const refresh = this.generateJwtToken(user, 'refresh', 7 * 24 * 60 * 60);
    return {
      accessToken: access.token,
      refreshToken: refresh.token,
      expirationDateRefreshToken: refresh.exp,
    };
  }

  public regenerateAccessToken(refreshToken: string) {
    const payload = this.validateRefreshToken(refreshToken);
    return this.generateJwtToken(
      { id: payload.sub, email: payload.email, role: payload.role },
      'access',
      15 * 60
    );
  }

  public validateRefreshToken(token: string): TokenClaims {
    return this.verifyToken(token, 'refresh');
  }

  public validateAccessToken(token: string): TokenClaims {
    return this.verifyToken(token, 'access');
  }

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

  public generateResetToken(_user: TokenIdentity) {
    return {
      token: randomBytes(32).toString('hex'),
      exp: new Date(Date.now() + 30 * 60 * 1000),
    };
  }

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
