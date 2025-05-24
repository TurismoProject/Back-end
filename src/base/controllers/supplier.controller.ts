import { PasswordHasherPipe } from '@pipes/password-hasher.pipe';
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
  Put,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AbstractSupplierRepository } from '@repositories/suppliers/abstract-supplier.repository';
import { isUUID } from 'class-validator';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '@decorators/user-roles.decorator';

@Controller('provedor')
export class SupplierController {
  constructor(private readonly repository: AbstractSupplierRepository) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getSupplier(@Headers('uuid') uuid: string) {
    if (!uuid) {
      const suppliers = await this.repository.findAll();
      return suppliers;
    }

    if (!isUUID(uuid)) throw new ConflictException('Invalid UUID');

    const supplier = await this.repository.findById(uuid);
    return supplier;
  }

  @Post('cadastro')
  @HttpCode(HttpStatus.CREATED)
  async createSupplier(
    @Body(new PasswordHasherPipe()) body: CreateSupplierDto
  ) {
    const supplier = await this.repository.create(body);

    return {
      companyName: supplier.name,
      email: supplier.email,
      supplierId: supplier.id,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async loginSupplier(@Body() body: { email: string; password: string }) {
    const { email, password } = body;
    const tokens = await this.repository.login(email, password);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      message: 'Login successful',
    };
  }

  @Put('atualizar')
  @HttpCode(HttpStatus.OK)
  async updateSupplier(@Body() body: UpdateSupplierDto) {
    const supplier = await this.repository.update(body.id, body);

    return {
      companyName: supplier.name,
      email: supplier.email,
      password: supplier.password,
    };
  }

  @Delete('excluir')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSupplier(@Body('uuid', new ParseUUIDPipe()) uuid: string) {
    return await this.repository.delete(uuid);
  }

  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'))
  @Roles('SUPPLIER')
  async getSupplierDashboard(@Headers('Authorization') jwt: string) {
    try {
      const token = jwt.split(' ')[1];
      const dashboardData = await this.repository.getDashboardData(token);
      return dashboardData;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new ConflictException('Error retrieving dashboard data');
    }
  }
}
