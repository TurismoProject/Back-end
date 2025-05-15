import { LocalAuthGuard } from '@common/guards/auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
// import { RolesGuard } from '@common/guards/roles.guard';
import { AuthModel } from '@common/models/auth.model';
import { CpfFormatPipe } from '@common/pipes/cpf-format.pipe';
import { PasswordHasherPipe } from '@common/pipes/password-hasher.pipe';
import { Roles } from '@decorators/user-roles.decorator';
import { CreateUserWithGoogleDto } from '@dtos/create-user-google.dto';
import { CreateUserDto } from '@dtos/create-user.dto';
import { LoginDto } from '@dtos/login.dto';
import { UpdateUserDto } from '@dtos/update-user.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { AbstractUserRepository } from '@repositories/user/abstract-user.repository';

@Controller('usuario')
// @UseGuards(RolesGuard)
@ApiTags('usuario')
export class UserController {
  private readonly frontendUrl: string;
  constructor(private readonly repository: AbstractUserRepository, private readonly configService: ConfigService) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL');
  }

  @Post('cadastro')
  @UsePipes(new PasswordHasherPipe<CreateUserDto>(), CpfFormatPipe)
  async create(@Body() user: CreateUserDto) {
    const newUser = await this.repository.create(user);
    return newUser;
  }

  @Get('auth/google')
  @UseGuards(AuthGuard('google'))
  async googleLogin() { }

  @Get('auth/google/create/callback')
  @UseGuards(AuthGuard('google'))
  async googleCreateRedirect(@Req() req, @Res() res) {
    const result = await this.repository.createWithGoogle(req.user);
    return res.redirect(`${this.frontendUrl}/create/callback?token=${result.token}`);
  }

  @Get('auth/google/login/callback')
  @UseGuards(AuthGuard('google'))
  async googleLoginRedirect(@Req() req, @Res() res) {
    const result = await this.repository.loginWithGoogle(req.user);
    return res.redirect(`${this.frontendUrl}/login/callback?token=${result.token}`);
  }

  @Post('login')
  async login(@Body() user: LoginDto) {
    const logIn: AuthModel = await this.repository.login(
      user.email,
      user.password
    );

    return logIn;
  }

  @Post('relogar')
  @UseGuards(AuthGuard('jwt'))
  async refreshJWT(@Body() body: { refreshToken: string }) {
    const logIn: AuthModel = await this.repository.refreshJWT(
      body.refreshToken
    );

    return logIn;
  }

  @Post('forgot-password')

  async forgetPasswordUser(@Body() body: { email: string }) {
    const response = await this.repository.sendUserPasswordResetLink(body.email);
    return response;
  }

  // @UseGuards(LocalAuthGuard)
  @Put('atualizar/:id')
  @Roles('admin')
  @UseGuards(AuthGuard('jwt'))
  @UsePipes(new PasswordHasherPipe<User>())
  async update(@Param('id') id: string, @Body() user: UpdateUserDto) {
    const updatedUserData = await this.repository.updateUser(id, user);
    return { message: 'Usuário Atualizado com Sucesso', updatedUserData };
  }

  @Get('informacoes')
  @Roles('admin')
  @UseGuards(AuthGuard('jwt'))
  async getUser(@Headers('Authorization') authorization: string) {
    const accessToken = authorization.split(' ')[1];
    const UserData = await this.repository.findByAccessJWT(accessToken);
    console.log(UserData);
    return {
      user: {
        name: UserData.name,
        email: UserData.email,
      },
    };
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Admin')
  @Delete('excluir/:id')
  @UsePipes(new PasswordHasherPipe<User>())
  async deleteUser(@Param('id') id: string) {
    const deleteUser = await this.repository.deleteUser(id);
    return {
      message: `Usuário ${deleteUser.name} foi removido com sucesso.`,
      deleteUser,
    };
  }

  @Roles('Admin')
  @Get('buscar/todos')
  // @UseGuards(AuthGuard('jwt'), RolesGuard)
  async findAll(@Req() req) {
    const users: User[] = await this.repository.findAll();
    return users;
  }
}
