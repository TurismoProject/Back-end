import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';

import { ExceptionsHandler } from '@nestjs/core/exceptions/exceptions-handler';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@ApiTags('users')
export class UserController {
  constructor(private repository: UserService) {}

  @Get()
  async findAll() {
    const users = await this.repository.findAll();
    return users;
  }

  async findById(@Headers('id') id: string) {
    const user = await this.repository.findUserById(parseInt(id));
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
  @Post('Cadastrar-se') //todo colocar header para autenticação do usuario
  async create(@Body() user: CreateUserDto) {
    const newUser = await this.repository.create(user);
    return newUser;
  }

  @Patch(':id') //todo colocar header para autenticação do usuario
  async update(@Param('id') id: number, @Body() user: UpdateUserDto) {
    try {
    } catch (error) {}
    const updateUser = await this.repository.update({
      ...user,
      id: +id,
    });
    return updateUser;
  }

  @Delete('Excluir')
  async delete(@Headers('id') id: string) {
    const parsedId = parseInt(id, 10);
    try {
      if (isNaN(parsedId)) {
        throw new BadRequestException('Invalid ID');
      }

      const deleteResult = await this.repository.delete(parsedId);
      if (deleteResult.id === 0 || deleteResult.id === null) {
        throw new NotFoundException('Entity not found');
      }
    } catch (error) {
      throw new ExceptionsHandler(error);
    }
    return { message: 'Entity deleted successfully' };
  }
}
