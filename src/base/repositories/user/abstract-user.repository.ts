import { AuthModel } from '@common/models/auth.model';
import { GoogleAuthentication } from '@common/models/user-google-authenticate.model';
import { CreateUserWithGoogleDto } from '@dtos/create-user-google.dto';
import { CreateUserDto } from '@dtos/create-user.dto';
import { UpdateUserDto } from '@dtos/update-user.dto';
import { User } from '@prisma/client';

export abstract class AbstractUserRepository {
  abstract create(user: CreateUserDto): Promise<User>;
  abstract createWithGoogle(user: CreateUserWithGoogleDto): Promise<GoogleAuthentication>
  abstract login(email: string, password: string): Promise<AuthModel>;
  abstract loginWithGoogle(user: CreateUserWithGoogleDto): Promise<GoogleAuthentication>;
  abstract logout(jwt: string): Promise<void>;
  abstract refreshJWT(jwt: string): Promise<AuthModel>;
  abstract findByAccessJWT(jwt: string): Promise<User>;
  abstract findAll(): Promise<User[]>;
  abstract updateUser(id: string, user: UpdateUserDto): Promise<User>;
  abstract deleteUser(id: string): Promise<User>;
  abstract sendUserPasswordResetLink(email: string): Promise<string>;
}
