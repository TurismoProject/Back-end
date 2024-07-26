import {
  Body,
  Controller,
  // Delete,
  // Get,
  // Param,
  // Patch,
  Post,
  // Put,
} from '@nestjs/common';
import UserCliente from './user.entity';
import { ApiTags } from '@nestjs/swagger';
import { UserRepository } from './user.repository';

@Controller('users')
@ApiTags('users')
export class UserController {
  constructor(private repository: UserRepository) {}
  @Post()
  async create(@Body() userClient: UserCliente) {
    const newUser = await this.repository.create(userClient);
    return newUser;
  }

  // @Get()
  // async read() {
  //   return { users: [] };
  // }
  // @Get(':id')
  // async readOne(@Param() param) {
  //   return { users: {}, param };
  // }
  // @Put(':id')
  // async update(@Body() body, @Param() params) {
  //   return {
  //     method: 'put',
  //     body,
  //     params,
  //   };
  // }
  // @Patch(':id')
  // async updatePartial(@Body() body, @Param() params) {
  //   return {
  //     method: 'patch',
  //     body,
  //     params,
  //   };
  // }
  // @Delete(':id')
  // async delete(@Param() params) {
  //   return { params };
  // }
}
