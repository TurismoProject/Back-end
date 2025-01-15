import { LocalAuthGuard } from '@common/guards/auth.guard';
import { AuthModel } from '@common/models/auth.model';
import { UserAuthentication } from '@common/models/user-authenticate.model';
import { PasswordHasherPipe } from '@common/pipes/password-hasher.pipe';
import { CreateAdminDto } from '@dtos/create-admin.dto';
import { LoginDto } from '@dtos/login.dto';
import { UpdateAdminDto } from '@dtos/update-admin.dto';
import { Body, Controller, Get, Post, Put, UseGuards, UsePipes, Headers, Param, } from '@nestjs/common';
import { Admin } from '@prisma/client';
import { AbstractAdminRepository } from '@repositories/admin/abstract-admin.repository';

@Controller('admin')
export class AdminController {
  constructor(private repository: AbstractAdminRepository) { }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  async login(@Body() user: LoginDto) {
    const logIn: AuthModel = await this.repository.login(user.email, user.password);
    return logIn;
  }

  @Post('cadastro')
  @UsePipes(new PasswordHasherPipe<CreateAdminDto>())
  async createAdmin(@Body() admin: CreateAdminDto): Promise<UserAuthentication> {
    const createdAdmin = await this.repository.createAdmin(admin);
    return createdAdmin;
  }

  @Put('atualizar/:id')
  @UsePipes(new PasswordHasherPipe<CreateAdminDto>())
  async updateAdmin(@Param('id') id: string, @Body() user: UpdateAdminDto) {
    const updatedAdminData = await this.repository.updateAdmin(id, user);
    return { message: 'Usuário Atualizado com Sucesso', updatedAdminData };
  }
}
