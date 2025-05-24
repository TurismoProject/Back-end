import { AuthModel } from '@common/models/auth.model';
import { CreateSupplierDto } from '@dtos/create-supplier.dto';
import { UpdateSupplierDto } from '@dtos/update-supplier.dto';
import { Supplier } from '@prisma/client';
import {
  AbstractBaseRepository,
  AbstractBaseAuthRepository,
} from '@common/repositories/abstract-base.repository';
import { SupplierDashboardDto } from '@dtos/supplier-dashboard.dto';

export abstract class AbstractSupplierRepository
  extends AbstractBaseRepository<Supplier, CreateSupplierDto, UpdateSupplierDto>
  implements AbstractBaseAuthRepository<Supplier>
{
  // Authentication methods (from AbstractBaseAuthRepository)
  abstract login(email: string, password: string): Promise<AuthModel>;
  abstract getByJwt(jwt: string): Promise<Supplier>;
  abstract refreshAccessToken(jwt: string): Promise<AuthModel>;
  abstract logout(jwt: string): Promise<void>;

  // Supplier specific methods
  abstract getDashboardData(jwt: string): Promise<SupplierDashboardDto>;
}
