import { PasswordHasherPipe } from '@common/pipes/password-hasher.pipe';
import { CreateUserDto } from '@dtos/create-user.dto';
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
  UsePipes
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AbstractUserRepository } from '@repositories/user/abstract-user.repository';

@Controller('usuario')
@ApiTags('usuario')
export class UserController {
  constructor(private repository: AbstractUserRepository) {}

  @Post('cadastro')
  @UsePipes(new PasswordHasherPipe<CreateUserDto>())
  async create(@Body() user: CreateUserDto) {
    const newUser = await this.repository.create(user);
    return newUser;
  }

  @Patch('atualizar/:id')
  @UsePipes(new PasswordHasherPipe<CreateUserDto>())  
  async update(@Headers('id') id: string, @Body() user: UpdateUserDto) {
    const updatedUserData = await this.repository.updateUser(id, user);
    return { message: "Usuário Atualizado com Sucesso", updatedUserData }
  }

  @Get('buscar/:id')
  @UsePipes(new PasswordHasherPipe<CreateUserDto>())
  async getUser(@Param('id') id: string) {
    const UserData = await this.repository.findById(id);
    return { message: ` Usuário encontrado com Sucesso`, UserData };
  }   

  @Delete('excluir/:id')
  @UsePipes(new PasswordHasherPipe<CreateUserDto>())
  async deleteUser(@Param('id') id: string) {
    const deleteUser = await this.repository.deleteUser(id);
    return { message: `Usuário ${deleteUser.name} foi removido com sucesso.` };
  }

  @Get('buscar/todos')
  async findAll() {
    const allUsers = await this.repository.findAll();
    return allUsers;  
  }

}
