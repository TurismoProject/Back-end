import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from '@dtos/create-user.dto';
import { AbstractUserRepository } from '@repositories/user/abstract-user.repository';

import { ExceptionsHandler } from '@nestjs/core/exceptions/exceptions-handler';
import { UpdateUserDto } from '@dtos/update-user.dto';

@Controller('usuario')
@ApiTags('usuario')
export class UserController {
  constructor(private repository: AbstractUserRepository) {}

  @Get()
  async findAll() {
    const users = await this.repository.findAll();
    return users;
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findUserUnique(@Headers('cpf') cpf: string) {
    const user = await this.repository.findUserUniqueCpf(cpf);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @Post('cadastro') //todo colocar header para autenticação do usuario
  async create(@Body() user: CreateUserDto) {
    const newUser = await this.repository.create(user);
    return newUser;
  }

  @Patch(':id') //todo colocar header para autenticação do usuario
  async update(@Headers('id') id: string, @Body() user: UpdateUserDto) {
    let updateUser = {};
    const parsedId = parseInt(id, 10);

    if (isNaN(parsedId)) {
      throw new BadRequestException('Invalid ID');
    }

    try {
      updateUser = await this.repository.update({
        ...user,
        id: parsedId,
      });
    } catch (error) {
      throw new ExceptionsHandler(error);
    }
    return updateUser;
  }

  @Delete('Excluir')
  async delete(@Headers('id') id: string) {
    const parsedId = parseInt(id, 10);

    if (isNaN(parsedId)) {
      throw new BadRequestException('Invalid ID');
    }

    try {
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
