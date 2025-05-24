import { AuthModel } from '@common/models/auth.model';
import { CreateAdminDto } from '@dtos/create-admin.dto';
import { UpdateAdminDto } from '@dtos/update-admin.dto';
import { Admin } from '@prisma/client';
import {
  AbstractBaseAuthRepository,
  AbstractBaseRepository,
} from '@commonrepos/abstract-base.repository';

/**
 * Abstract repository for Admin entity operations
 */
export abstract class AbstractAdminRepository
  extends AbstractBaseRepository<Admin, CreateAdminDto, UpdateAdminDto>
  implements AbstractBaseAuthRepository<Admin>
{
  abstract create(userAdmin: CreateAdminDto): Promise<Admin>;
  abstract findAll(): Promise<Admin[]>;
  abstract findById(id: string): Promise<Admin>;
  abstract update(id: string, userAdmin: UpdateAdminDto): Promise<Admin>;
  abstract delete(id: string): Promise<Admin>;
  abstract login(email: string, password: string): Promise<AuthModel>;
  abstract refreshAccessToken(jwt: string): Promise<AuthModel>;
  abstract getByJwt(jwt: string): Promise<Admin>;
  abstract logout(jwt: string): Promise<void>;
}
