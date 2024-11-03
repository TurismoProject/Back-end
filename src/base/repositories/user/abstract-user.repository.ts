import { CreateUserDto } from '@dtos/create-user.dto';
import { UpdateUserDto } from '@dtos/update-user.dto';
import { User } from '@prisma/client';

export abstract class AbstractUserRepository {
  abstract create(user: CreateUserDto): Promise<User>;
  abstract findAll(): Promise<User[]>;
  abstract findById(id: string): Promise<User>;
  // eslint-disable-next-line prettier/prettier
  abstract findFirstUser({ email, cpf }: { email?: string; cpf?: string }): Promise<User>;
  abstract updateUser(id: string,user: UpdateUserDto): Promise<User>;
  abstract deleteUser(id: string): Promise<User>;
}
