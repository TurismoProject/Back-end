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

  validateUser(email: string, password: string): Promise<User> {
    return this.authService.validateUser(email, password);
  }

  validateAdmin(email: string, password: string): Promise<Admin> {
    return this.authService.validateAdmin(email, password);
  }
}
