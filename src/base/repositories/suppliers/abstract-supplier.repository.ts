import { CreateSupplierDto } from '@dtos/create-supplier.dto';
import { UpdateSupplierDto } from '@dtos/update-supplier.dto';
import { Supplier } from '@prisma/client';

export abstract class AbstractSupplierRepository {
  abstract create(data: CreateSupplierDto): Promise<Supplier>;
  abstract getAll(): Promise<Array<Supplier>>;
  abstract getByUUID(uuid: string): Promise<Supplier>;
  abstract getByEmail(email: string): Promise<Supplier>;
  abstract update(data: UpdateSupplierDto): Promise<Supplier>;
  abstract delete(uuid: string): Promise<null>;
}
