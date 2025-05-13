import { JwtService } from '@nestjs/jwt';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Admin, Supplier, User } from '@prisma/client';
import { AuthModel } from '@common/models/auth.model';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) { }

  public generateTokens(user: User | Admin | Supplier): AuthModel {
    const accessTokenObj = this.generateJwtToken(user, '15d');
    const refreshTokenObj = this.generateJwtToken(user, '7d');

    const tokens: AuthModel = {
      accessToken: accessTokenObj.token,
      refreshToken: refreshTokenObj.token,
      expirationDateRefreshToken: refreshTokenObj.exp,
    };

    return tokens;
  }

  public regenerateAccessToken(refreshToken: string) {
    const decoded = this.jwtService.verify(refreshToken);
    return this.generateJwtToken(decoded, '15m');
  }

  public validateAccessToken(token: string): any {
    try {
      const payload = this.jwtService.verify(token);
      return payload;
    } catch (error) {
      return new InternalServerErrorException(error);
    }
  }

  public generateResetToken(user: User | Admin | Supplier) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const token = this.jwtService.sign({ ...payload, exp: Math.floor(Date.now() / 1000) + (2 * 24 * 60 * 60) });
    const tokenObject = this.jwtService.decode(token);
    const { exp } = tokenObject;
    return {
      token,
      exp,
    };
  }

  private generateJwtToken(
    user: User | Admin | Supplier,
    expiration: string = '15d'
  ) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const token = this.jwtService.sign({ ...payload, exp: Math.floor(Date.now() / 1000) + (15 * 24 * 60 * 60) });
    const tokenObject = this.jwtService.decode(token);
    const { exp } = tokenObject;
    return {
      token,
      exp,
    };

  }
}
