import { LocalAuthGuard } from '@common/guards/auth.guard';
import { AuthModel } from '@common/models/auth.model';
import { CpfMaskPipe } from '@common/pipes/cpf-format.pipe';
import { PasswordHasherPipe } from '@common/pipes/password-hasher.pipe';
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
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { AbstractUserRepository } from '@repositories/user/abstract-user.repository';

@Controller('usuario')
@ApiTags('usuario')
export class UserController {
  constructor(private repository: AbstractUserRepository) {}

  @Post('cadastro')
  @UsePipes(new PasswordHasherPipe<CreateUserDto>(), CpfMaskPipe)
  async create(@Body() user: CreateUserDto) {
    const AuthModel = await this.repository.create(user);
    return {
      accessToken: AuthModel.accessToken,
      refreshToken: AuthModel.refreshToken,
    };
  }

  @Post('check-email')
  async checkEmail(@Body('email') email: string) {
    const status = await this.repository.emailInUse(email);

    return { inUse: status };
  }

  @Post('check-phone')
  async checkPhone(@Body('phone') phoneNumber: string) {
    console.log(phoneNumber);
    const status = await this.repository.phoneInUse(phoneNumber);

    return { inUse: status };
  }

  @Post('check-cpf')
  async checkCpf(@Body(CpfMaskPipe) body: { cpf: string }) {
    const userStatus = await this.repository.cpfInUse(body.cpf);

    return { inUse: userStatus };
  }

  @Post('login')
  // @UseGuards(LocalAuthGuard)
  async login(@Body() user: LoginDto) {
    const logIn: AuthModel = await this.repository.login(
      user.email,
      user.password
    );

    console.log('teste');
    return logIn;
  }

  @Post('relogar')
  async refreshJWT(@Body() body: { refreshToken: string }) {
    const logIn: AuthModel = await this.repository.refreshJWT(
      body.refreshToken
    );

    return logIn;
  }

  // @UseGuards(LocalAuthGuard)
  @Put('atualizar/:id')
  @UseGuards(LocalAuthGuard)
  @UsePipes(new PasswordHasherPipe<User>())
  async update(@Param('id') id: string, @Body() user: UpdateUserDto) {
    const updatedUserData = await this.repository.updateUser(id, user);
    return { message: 'Usuário Atualizado com Sucesso', updatedUserData };
  }

  @Get('informacoes')
  // @UseGuards(LocalAuthGuard)
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

  @Delete('excluir/:id')
  @UseGuards(LocalAuthGuard)
  @UsePipes(new PasswordHasherPipe<User>())
  async deleteUser(@Param('id') id: string) {
    const deleteUser = await this.repository.deleteUser(id);
    return {
      message: `Usuário ${deleteUser.name} foi removido com sucesso.`,
      deleteUser,
    };
  }

  @Get('buscar/todos')
  @UseGuards(LocalAuthGuard)
  async findAll() {
    const allUsers = await this.repository.findAll();
    return allUsers;
  }
}
