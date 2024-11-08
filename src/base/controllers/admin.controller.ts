import { PasswordHasherPipe } from '@common/pipes/password-hasher.pipe';
import { CreateAdminDto } from '@dtos/create-admin.dto';
import { Body, Controller, Get, Post, UsePipes } from '@nestjs/common';

@Controller('admin')
export class AdminController {
  constructor() {}

  @Post('cadastro')
  @UsePipes(new PasswordHasherPipe<CreateAdminDto>())
  async createAdmin(@Body() admin: CreateAdminDto) {}
}
