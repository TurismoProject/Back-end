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
import { ClientService } from './client.service';
import { ClientUserDto } from './dto/client.dto';
import Client from './client.entity';
import { ExceptionsHandler } from '@nestjs/core/exceptions/exceptions-handler';

@Controller('users')
@ApiTags('users')
export class ClientController {
  constructor(private repository: ClientService) {}

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
  @Post('Cadastro')
  async create(@Body() userClient: ClientUserDto) {
    const newUser = await this.repository.create(userClient);
    return newUser;
  }

  @Patch(':id')
  async update(@Param('id') id: number, @Body() user: Client) {
    try {
    } catch (error) {}
    const updateUser = await this.repository.update({
      ...user,
      id: +id,
    });
    return updateUser;
  }

  @Delete('delete')
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
    // if (isNaN(parsedId)) {
    //   throw new BadRequestException('Invalid ID');
    // }

    // const deleteResult = await this.repository.delete(parsedId);
    // if (deleteResult.id === 0 || deleteResult.id === null) {
    //   throw new NotFoundException('Entity not found');
    // }

    return { message: 'Entity deleted successfully' };
  }
}
