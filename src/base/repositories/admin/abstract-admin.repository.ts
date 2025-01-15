/* eslint-disable prettier/prettier */
import { AuthModel } from '@common/models/auth.model';
import { UserAuthentication } from '@common/models/user-authenticate.model';
import { CreateAdminDto } from '@dtos/create-admin.dto';
import { UpdateAdminDto } from '@dtos/update-admin.dto';
import { Admin } from '@prisma/client';

export abstract class AbstractAdminRepository {
  abstract createAdmin(userAdmin: CreateAdminDto): Promise<UserAuthentication>;
  abstract login(email: string, password: string): Promise<AuthModel>
  abstract findAll(): Promise<Admin[]>;
  abstract findById(id: string): Promise<Admin>;
  abstract findByEmail(email: string): Promise<Admin>
  // eslint-disable-next-line prettier/prettier
  abstract updateAdmin(id: string, userAdmin: UpdateAdminDto): Promise<Admin>;
  abstract deleteAdmin(id: string): Promise<Admin>;
}
