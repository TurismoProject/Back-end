import { PasswordHasherPipe } from '@common/pipes/password-hasher.pipe';
import { CreateSupplierDto } from '@dtos/create-supplier.dto';
import { UpdateSupplierDto } from '@dtos/update-supplier.dto';
import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  NotFoundException,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { AbstractSupplierRepository } from '@repositories/suppliers/abstract-supplier.repository';
import { isUUID } from 'class-validator';
import * as bcrypt from 'bcrypt';

@Controller('provedor')
export class SupplierController {
  constructor(private readonly repository: AbstractSupplierRepository) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getSupplier(@Headers('uuid') uuid: string) {
    if (!uuid) {
      const suppliers = await this.repository.getAll();
      return suppliers;
    }

    if (!isUUID(uuid)) throw new ConflictException('Invalid UUID');

    const supplier = await this.repository.getByUUID(uuid);
    return supplier;
  }

  @Post('cadastro')
  @HttpCode(HttpStatus.CREATED)
  async createSupplier(
    @Body(new PasswordHasherPipe()) body: CreateSupplierDto,
  ) {
    console.log(body.password);
    const supplier = await this.repository.create(body);

    return {
      companyName: supplier.companyName,
      email: supplier.email,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async loginSupplier(@Body() body: { email: string; password: string }) {
    const supplier = await this.repository.getByEmail(body.email);

    if (!supplier) throw new NotFoundException('Supplier not found');

    if (!(await bcrypt.compare(body.password, supplier.password)))
      throw new ConflictException('Invalid password');

    return {
      companyName: supplier.companyName,
      email: supplier.email,
      password: supplier.password,
    };
  }

  @Patch('atualizar')
  @HttpCode(HttpStatus.OK)
  async updateSupplier(@Body() body: UpdateSupplierDto) {
    const supplier = await this.repository.update(body);

    return {
      companyName: supplier.companyName,
      email: supplier.email,
      password: supplier.password,
    };
  }

  @Delete('excluir')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSupplier(@Body('uuid', new ParseUUIDPipe()) uuid: string) {
    return await this.repository.delete(uuid);
  }
}
