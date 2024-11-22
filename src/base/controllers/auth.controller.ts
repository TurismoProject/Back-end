import { LocalAuthGuard } from '@common/guards/auth.guard';
import { CreateAdminDto } from '@dtos/create-admin.dto';
import { CreateSupplierDto } from '@dtos/create-supplier.dto';
import { CreateUserDto } from '@dtos/create-user.dto';
import { LoginDto } from '@dtos/login.dto';
import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '@services/auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  async login(@Body() user: LoginDto) {
    const logIn = await this.authService.login(user.email, user.password);
    return logIn;
  }

  @Post('register')
  async register(
    @Body() user: CreateUserDto | CreateAdminDto | CreateSupplierDto,
    @Headers('role') role: string
  ) {
    const registered = await this.authService.register(user, role);
    return registered;
  }
}
