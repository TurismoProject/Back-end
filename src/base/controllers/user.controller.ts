import { Role } from '@common/enums/role.enum';
import { LocalAuthGuard } from '@common/guards/auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuthModel } from '@common/models/auth.model';
import { CpfMaskPipe } from '@common/pipes/cpf-format.pipe';
import { PasswordHasherPipe } from '@common/pipes/password-hasher.pipe';
import { Roles } from '@decorators/user-roles.decorator';
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
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { AbstractUserRepository } from '@repositories/user/abstract-user.repository';

@Controller('usuario')
@UseGuards(RolesGuard)
@ApiTags('usuario')
export class UserController {
  constructor(private readonly repository: AbstractUserRepository) { }

  @Post('cadastro')
  @Roles(Role.USER, Role.ADMIN)
  @UsePipes(new PasswordHasherPipe<CreateUserDto>(), CpfMaskPipe)
  async create(@Body() user: CreateUserDto) {
    const newUser = await this.repository.create(user);
    return newUser;
  }

  @Post('login')
  @Roles(Role.USER)
  async login(@Body() user: LoginDto) {
    const logIn: AuthModel = await this.repository.login(
      user.email,
      user.password
    );

    console.log('teste');
    return logIn;
  }

  @Post('relogar')
  @UseGuards(AuthGuard('jwt'))
  @Roles(Role.USER)
  async refreshJWT(@Body() body: { refreshToken: string }) {
    const logIn: AuthModel = await this.repository.refreshJWT(
      body.refreshToken
    );

    return logIn;
  }

  // @UseGuards(LocalAuthGuard)
  @Put('atualizar/:id')
  @Roles(Role.USER, Role.ADMIN)
  @UseGuards(AuthGuard('jwt'))
  @UsePipes(new PasswordHasherPipe<User>())
  async update(@Param('id') id: string, @Body() user: UpdateUserDto) {
    const updatedUserData = await this.repository.updateUser(id, user);
    return { message: 'Usuário Atualizado com Sucesso', updatedUserData };
  }

  @Get('informacoes')
  @Roles(Role.USER, Role.ADMIN)
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

  @Delete('excluir/:id')
  @Roles(Role.USER, Role.ADMIN)
  @UseGuards(AuthGuard('jwt'))
  @UsePipes(new PasswordHasherPipe<User>())
  async deleteUser(@Param('id') id: string) {
    const deleteUser = await this.repository.deleteUser(id);
    return {
      message: `Usuário ${deleteUser.name} foi removido com sucesso.`,
      deleteUser,
    };
  }

  @Get('buscar/todos')
  @Roles(Role.ADMIN)
  async findAll() {
    const allUsers = await this.repository.findAll();
    return allUsers;
  }
}
