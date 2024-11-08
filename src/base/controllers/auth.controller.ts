import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from '@services/auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async login() {
    // return this.authService.login();
  }
}
