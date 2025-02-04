import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Admin, User } from '@prisma/client';
import { AuthService } from '@services/auth.service';
import { Strategy } from 'passport-local';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validateUser(email: string, password: string): Promise<User> {
    return await this.authService.validateUser(email, password);
  }

  async validateAdmin(email: string, password: string): Promise<Admin> {
    return await this.authService.validateAdmin(email, password);
  }

  // async validate(email: string, password: string): Promise<User | Admin> {
  //   const user = await this.authService.validateUser(email, password);
  //   if (user) return user;

  //   const admin = await this.authService.validateAdmin(email, password);
  //   if (admin) return admin;

  //   throw new UnauthorizedException('Invalid credentials');
  // } 
}
