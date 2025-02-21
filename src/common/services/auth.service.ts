import { JwtService } from '@nestjs/jwt';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Admin, Supplier, User } from '@prisma/client';
import { AuthModel } from '@common/models/auth.model';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  public generateTokens(user: User | Admin | Supplier): AuthModel {
    const accessTokenObj = this.generateJwtToken(user, '15m');
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

  private generateJwtToken(
    user: User | Admin | Supplier,
    expiration: string = '15m'
  ) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const token = this.jwtService.sign(payload, { expiresIn: expiration });
    const tokenObject = this.jwtService.decode(token) as any;
    const { exp } = tokenObject;
    return {
      token,
      exp,
    };
  }
}
