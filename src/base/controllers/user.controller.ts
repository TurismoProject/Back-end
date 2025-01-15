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
  Patch,
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
  constructor(private repository: AbstractUserRepository) { }

  @Post('cadastro')
  @UsePipes(new PasswordHasherPipe<CreateUserDto>(), CpfMaskPipe)
  async create(@Body() user: CreateUserDto) {
    const newUser = await this.repository.create(user);
    return newUser;
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  async login(@Body() user: LoginDto) {
    const logIn: AuthModel = await this.repository.login(user.email, user.password);
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

  @Get('buscar/:id')
  @UsePipes(new PasswordHasherPipe<User>())
  async getUser(@Param('id') id: string) {
    const UserData = await this.repository.findById(id);
    return { message: ` Usuário encontrado com Sucesso`, UserData };
  }

  @Delete('excluir/:id')
  @UseGuards(LocalAuthGuard)
  @UsePipes(new PasswordHasherPipe<User>())
  async deleteUser(@Param('id') id: string) {
    const deleteUser = await this.repository.deleteUser(id);
    return { message: `Usuário ${deleteUser.name} foi removido com sucesso.`, deleteUser };
  }

  @Get('buscar/todos')
  @UseGuards(LocalAuthGuard)
  async findAll() {
    const allUsers = await this.repository.findAll();
    return allUsers;
  }
}
