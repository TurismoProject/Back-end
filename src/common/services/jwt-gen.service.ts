import { JwtService } from '@nestjs/jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthModel } from '@common/models/auth.model';
import { randomBytes } from 'crypto';

export interface JwtPayload {
  sub: string;
  email: string;
  role?: string;
  userType: string;
}

export interface TokenResponse {
  token: string;
  exp: number;
}

@Injectable()
export class JwtGeneratorService {
  constructor(private readonly jwtService: JwtService) {}

  public generateTokens<T extends { id: string; email: string; role: Role }>(
    user: T,
  ): AuthModel {
    const accessTokenObj = this.generateJwtToken(user, '15m');
    const refreshTokenObj = this.generateJwtToken(user, '7d');

    return {
      accessToken: accessTokenObj.token,
      refreshToken: refreshTokenObj.token,
      expirationDateRefreshToken: refreshTokenObj.exp,
    };
  }

  public regenerateAccessToken(refreshToken: string): TokenResponse {
    try {
      const decoded = this.jwtService.verify(refreshToken);
      return this.generateJwtToken(decoded, '15m');
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  public validateAccessToken(token: string): JwtPayload {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid access token');
    }
  }

  public generateResetToken(user: { id: string; email: string }) {
    const token = randomBytes(32).toString('hex');
    const expiration = new Date(Date.now() + 30 * 60 * 1000);

    return {
      token,
      exp: expiration,
    };
  }

  private generateJwtToken<
    T extends { id: string; email: string; role?: Role },
  >(user: T, expiration: string = '15m'): TokenResponse {
    const role = user.role || Role.USER;
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: role,
      userType: role,
    };

    const token = this.jwtService.sign(payload, {
      expiresIn: expiration as any,
    });
    const tokenObject = this.jwtService.decode(token) as any;

    return {
      token,
      exp: tokenObject.exp,
    };
  }
}
