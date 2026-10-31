import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@decorators/user-roles.decorator';
import { AuthModel } from '@common/models/auth.model';
import { PasswordHasherPipe } from '@common/pipes/password-hasher.pipe';
import { CreateAdminDto } from '@dtos/create-admin.dto';
import { LoginDto } from '@dtos/login.dto';
import { UpdateAdminDto } from '@dtos/update-admin.dto';
import {
  Body,
  Controller,
  Post,
  Put,
  UseGuards,
  UsePipes,
  Param,
  Req,
  Get,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AbstractAdminRepository } from '@repositories/admin/abstract-admin.repository';

@Controller('admin')
export class AdminController {
  constructor(private repository: AbstractAdminRepository) {}

  @Post('login')
  async login(@Body() user: LoginDto) {
    const logIn: AuthModel = await this.repository.login(
      user.email,
      user.password
    );
    return logIn;
  }

  @Post('forgot-password')
  async forgetPasswordAdmin() {
    const response = console.log(); //await this.repository.forgetPasswordAdmin();
    return response;
  }

  /**
   * Restringe a criação de administradores a uma sessão já autenticada com perfil Admin.
   */
  @Post('cadastro')
  @Roles('Admin')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @UsePipes(new PasswordHasherPipe<CreateAdminDto>())
  async createAdmin(@Body() admin: CreateAdminDto) {
    const createdAdmin = await this.repository.create(admin);
    const { password: _password, ...profile } = createdAdmin;
    return profile;
  }

  /**
   * Exige perfil Admin para alterar contas administrativas; a resposta omite o hash da senha.
   */
  @Put('atualizar/:id')
  @Roles('Admin')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @UsePipes(new PasswordHasherPipe<CreateAdminDto>())
  async updateAdmin(@Param('id') id: string, @Body() user: UpdateAdminDto) {
    const updatedAdminData = await this.repository.updateAdmin(id, user);
    const { password: _password, ...profile } = updatedAdminData;
    return {
      message: 'Usuário Atualizado com Sucesso',
      updatedAdminData: profile,
    };
  }
  @UseGuards(AuthGuard('jwt'))
  @Get('validate')
  testValidate(@Req() req) {
    console.log('User from validate:', req.user);
    return {
      message: 'Token is valid!',
      user: req.user,
    };
  }
}
