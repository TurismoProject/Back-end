import {
  AbstractBaseRepository,
  AbstractBaseAuthRepository,
} from '@common/repositories/abstract-base.repository';
import { AuthModel } from '@common/models/auth.model';
import { GoogleAuthentication } from '@common/models/user-google-authenticate.model';
import { CreateUserWithGoogleDto } from '@dtos/create-user-google.dto';
import { CreateUserDto } from '@dtos/create-user.dto';
import { UpdateUserDto } from '@dtos/update-user.dto';
import { User } from '@prisma/client';

export abstract class AbstractUserRepository
  extends AbstractBaseRepository<User, CreateUserDto, UpdateUserDto>
  implements AbstractBaseAuthRepository<User>
{
  /**
   * Create a user
   * @param data The user data
   * @returns The created user
   */
  abstract create(data: CreateUserDto): Promise<User>;

  /**
   * Find a user by ID
   * @param id The user ID
   * @returns The found user
   */
  abstract findById(id: string): Promise<User>;

  /**
   * Find a user by email
   * @param email The user email
   * @returns The found user
   */
  abstract findByEmail: (email: string) => Promise<User>;

  /**
   * Find all users
   * @returns Array of users
   */
  abstract findAll(): Promise<User[]>;

  /**
   * Update a user
   * @param id The user ID
   * @param businessClient The user data
   * @returns The updated user
   */
  abstract update(id: string, data: UpdateUserDto): Promise<User>;

  /**
   * Delete a user
   * @param id The user ID
   * @returns The deleted user
   */
  abstract delete(id: string): Promise<User>;

  /**
   * Login a user
   * @param email The user email
   * @param password The user password
   * @returns Authentication model with tokens
   */
  abstract login(email: string, password: string): Promise<AuthModel>;

  /**
   * Get a user by JWT
   * @param jwt The JWT token
   * @returns The user
   */
  abstract getByJwt(jwt: string): Promise<User>;

  abstract refreshAccessToken(jwt: string): Promise<AuthModel>;

  /**
   * Logout a user
   * @param jwt The  user jwt to be invalidated
   */
  abstract logout(jwt: string): Promise<void>;

  /**
   * Create a user using Google
   * @param user The user data
   * @returns The created user
   */
  abstract createWithGoogle(
    user: CreateUserWithGoogleDto
  ): Promise<GoogleAuthentication>;

  /**
   * Login a user using Google
   * @param user The user data
   * @returns The created user
   */
  abstract loginWithGoogle(
    user: CreateUserWithGoogleDto
  ): Promise<GoogleAuthentication>;

  /**
   * Check if an email is in use
   * @param email The email to check
   * @returns True if the email is in use, false otherwise
   */
  abstract emailInUse(email: string): Promise<boolean>;

  /**
   * Check if a phone number is in use
   * @param phoneNumber The phone number to check
   * @returns True if the phone number is in use, false otherwise
   */
  abstract phoneInUse(phoneNumber: string): Promise<boolean>;

  /**
   * Check if a CPF is in use
   * @param cpf The CPF to check
   * @returns True if the CPF is in use, false otherwise
   */
  abstract cpfInUse(cpf: string): Promise<boolean>;
}
