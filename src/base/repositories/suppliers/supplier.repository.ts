import { PrismaService } from '@database/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { AbstractSupplierRepository } from './abstract-supplier.repository';
import { Supplier } from '@prisma/client';
import { CreateSupplierDto } from '@dtos/create-supplier.dto';
import { UpdateSupplierDto } from '@dtos/update-supplier.dto';
import { SupplierDashboardDto } from '@dtos/supplier-dashboard.dto';
import { JwtGeneratorService } from '@services/jwt-gen.service';
import { AbstractAuthenticateRepository } from '@repositories/auth/abstract-authenticate.repository';
import { BaseAuthRepository } from '@common/repositories/base.repository';
import { DashboardService } from '@services/dashboard.service';

@Injectable()
export class SupplierRepository
  extends BaseAuthRepository<Supplier, CreateSupplierDto, UpdateSupplierDto>
  implements AbstractSupplierRepository
{
  constructor(
    protected readonly prismaService: PrismaService,
    protected readonly jwtGenService: JwtGeneratorService,
    protected readonly authRepository: AbstractAuthenticateRepository,
    private readonly dashboardService: DashboardService
  ) {
    super(prismaService, authRepository, jwtGenService);
  }

  protected get model() {
    return this.prismaService.supplier;
  }

  async getDashboardData(jwt: string): Promise<SupplierDashboardDto> {
    // Check if supplier exists
    const supplier = await this.getByJwt(jwt);
    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    // Use the dashboard service to get the dashboard data
    return this.dashboardService.getSupplierDashboard(supplier.id);
  }
}
