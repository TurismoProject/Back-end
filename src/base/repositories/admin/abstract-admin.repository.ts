/* eslint-disable prettier/prettier */
import { CreateAdminDto } from '@dtos/create-admin.dto';
import { UpdateAdminDto } from '@dtos/update-admin.dto';
import { Admin } from '@prisma/client';

export abstract class AbstractAdminRepository {
  abstract createAdmin(userAdmin: CreateAdminDto): Promise<Admin>;
  abstract findAll(): Promise<Admin[]>;
  abstract findById(id: string): Promise<Admin>;
  // eslint-disable-next-line prettier/prettier
  abstract findFirstUser({
    email,
    name,
  }: {
    email?: string;
    name?: string;
  }): Promise<Admin>;
  abstract updateAdmin(id: string, userAdmin: UpdateAdminDto): Promise<Admin>;
  abstract deleteAdmin(id: string): Promise<Admin>;
}
