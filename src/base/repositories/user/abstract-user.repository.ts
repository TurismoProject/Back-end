import { CreateUserDto } from '@dtos/create-user.dto';
import { UpdateUserDto } from '@dtos/update-user.dto';

export abstract class AbstractUserRepository {
  abstract create(user: CreateUserDto): Promise<any>;
  abstract findAll(): Promise<any>;
  abstract findUserById(id: number): Promise<any>;
  abstract findUserUniqueCpf(cpf: string): Promise<any>;
  abstract update(user: UpdateUserDto): Promise<any>;
  abstract delete(id: number): Promise<any>;
}
