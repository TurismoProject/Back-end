import { UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { LoginDto } from '@dtos/login.dto';
import { RefreshTokenDto } from '@dtos/refresh-token.dto';
import {
  CurrentReservationActor,
  ReservationActor,
} from '../../reservations/auth/reservation-actor';
import {
  ReservationAccessGuard,
  ReservationRole,
} from '../../reservations/auth/reservation-access.guard';
import { SupplierAuthenticationService } from '../../reservations/auth/supplier-authentication.service';
import { PasswordHasherPipe } from '@common/pipes/password-hasher.pipe';
import { CreateSupplierDto } from '@dtos/create-supplier.dto';
import { UpdateSupplierDto } from '@dtos/update-supplier.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Patch,
  Post,
} from '@nestjs/common';
import { AbstractSupplierRepository } from '@repositories/suppliers/abstract-supplier.repository';

@Controller('provedor')
export class SupplierController {
  constructor(
    private readonly repository: AbstractSupplierRepository,
    private readonly authentication: SupplierAuthenticationService
  ) {}

  /**
   * Retorna o perfil público da própria conta, identificada pelo guard, sem expor o hash.
   */
  @Get()
  @UseGuards(ReservationAccessGuard)
  @ReservationRole(Role.Supplier)
  async getSupplier(@CurrentReservationActor() actor: ReservationActor) {
    const supplier = await this.repository.getByUUID(actor.id);
    return {
      id: supplier.id,
      name: supplier.name,
      email: supplier.email,
      cnpj: supplier.cnpj,
      phoneNumber: supplier.phoneNumber,
      address: supplier.address,
    };
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
    };
  }

  /**
   * Autentica o fornecedor e retorna tokens e identificação mínima para o painel.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  loginSupplier(@Body() body: LoginDto) {
    return this.authentication.login(body.email, body.password);
  }

  /**
   * Renova a sessão com rotação do refresh token, sem exigir access token válido.
   */
  @Post('relogar')
  @HttpCode(HttpStatus.OK)
  refreshSupplier(@Body() body: RefreshTokenDto) {
    return this.authentication.refresh(body.refreshToken);
  }

  /**
   * Atualiza somente o fornecedor autenticado; o pipe aplica hash a uma nova senha.
   * Um id enviado no corpo precisa coincidir com o da sessão.
   */
  @Patch('atualizar')
  @UseGuards(ReservationAccessGuard)
  @ReservationRole(Role.Supplier)
  @HttpCode(HttpStatus.OK)
  async updateSupplier(
    @CurrentReservationActor() actor: ReservationActor,
    @Body(new PasswordHasherPipe()) body: UpdateSupplierDto
  ) {
    if (body.id && body.id !== actor.id)
      throw new NotFoundException('Fornecedor não encontrado.');
    const supplier = await this.repository.update({ ...body, id: actor.id });

    return {
      companyName: supplier.name,
      email: supplier.email,
    };
  }

  /**
   * Solicita exclusão da própria conta; vínculos com saídas bloqueiam a remoção do histórico.
   */
  @Delete('excluir')
  @UseGuards(ReservationAccessGuard)
  @ReservationRole(Role.Supplier)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSupplier(@CurrentReservationActor() actor: ReservationActor) {
    return await this.repository.delete(actor.id);
  }
}
