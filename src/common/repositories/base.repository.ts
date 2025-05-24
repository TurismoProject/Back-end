import { PrismaService } from '@database/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthModel } from '@models/auth.model';
import {
  AbstractBaseAuthRepository,
  AbstractBaseRepository,
} from './abstract-base.repository';
import { AbstractAuthenticateRepository } from '@repositories/auth/abstract-authenticate.repository';
import { JwtGeneratorService } from '@services/jwt-gen.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

type HasEmail<T> = T extends { email: string } ? true : false;

@Injectable()
export abstract class BaseRepository<
  T,
  CreateDto,
  UpdateDto,
  HasEmailField extends boolean = HasEmail<T>,
> implements AbstractBaseRepository<T, CreateDto, UpdateDto, HasEmailField>
{
  constructor(protected readonly prismaService: PrismaService) {
    if (this.hasEmailField()) {
      this.findByEmail = ((email: string): Promise<T | null> => {
        return this.model.findUnique({
          where: { email },
        });
      }) as any;
    }
  }

  /**
   * The Prisma model to use for this repository
   * Must be implemented by child classes
   */
  protected abstract get model(): any;

  /**
   * Create a new entity
   * @param data The data to create the entity with
   * @returns The created entity
   */
  async create(data: CreateDto): Promise<T> {
    return this.model.create({
      data,
    });
  }

  /**
   * Find all entities
   * @returns An array of all entities
   */
  async findAll(): Promise<T[]> {
    return this.model.findMany();
  }

  /**
   * Find an entity by ID
   * @param id The ID of the entity to find
   * @returns The found entity or null
   */
  async findById(id: string): Promise<T | null> {
    return this.model.findUnique({
      where: { id },
    });
  }

  /**
   * Find an entity by email (if the entity has an email field)
   * @param email The email of the entity to find
   * @returns The found entity or null
   */
  findByEmail!: HasEmailField extends true
    ? (email: string) => Promise<T | null>
    : never;

  /**
   * Helper method to check if the entity has an email field
   * Used for conditional method implementation
   * @private
   */
  private hasEmailField(): HasEmailField {
    try {
      return (!!this.model.fields?.email ||
        !!this.model.fields?.find?.(
          (f) => f.name === 'email'
        )) as HasEmailField;
    } catch (e) {
      return true as HasEmailField;
    }
  }

  /**
   * Update an entity
   * @param id The ID of the entity to update
   * @param data The data to update the entity with
   * @returns The updated entity
   */
  async update(id: string, data: UpdateDto): Promise<T> {
    return this.model.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete an entity
   * @param id The ID of the entity to delete
   * @returns The deleted entity
   */
  async delete(id: string): Promise<T> {
    return this.model.delete({
      where: { id },
    });
  }
}

export abstract class BaseAuthRepository<
    T extends { id: string; email: string; password: string; role: Role },
    CreateDto,
    UpdateDto,
  >
  extends BaseRepository<T, CreateDto, UpdateDto>
  implements AbstractBaseAuthRepository<T>
{
  constructor(
    protected readonly prismaService: PrismaService,
    protected readonly auth: AbstractAuthenticateRepository,
    protected readonly jwtGenService: JwtGeneratorService
  ) {
    super(prismaService);
  }

  async login(email: string, password: string): Promise<AuthModel> {
    const userT = await this.findByEmail(email);
    if (!userT) throw new NotFoundException('User not found');

    const passwordMatch = await bcrypt.compare(password, userT.password);

    if (!passwordMatch) throw new NotFoundException('Invalid credentials');

    const tokens = this.jwtGenService.generateTokens(userT);

    const authData: AuthModel = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expirationDateRefreshToken: tokens.expirationDateRefreshToken,
      authId: userT.id,
    };

    await this.auth.authenticate(authData, userT.role);

    return authData;
  }

  async getByJwt(jwt: string): Promise<T> {
    const payload = this.jwtGenService.validateAccessToken(jwt);
    const userT = await this.findById(payload.sub);

    return userT;
  }

  async refreshAccessToken(jwt: string): Promise<AuthModel> {
    const isValid = await this.auth.validateJwt(jwt);
    if (!isValid) throw new NotFoundException('Invalid credentials');
    const accessTokenObj = this.jwtGenService.regenerateAccessToken(jwt);

    return {
      accessToken: accessTokenObj.token,
      refreshToken: jwt,
      expirationDateRefreshToken: accessTokenObj.exp,
    };
  }

  async logout(jwt: string): Promise<void> {
    await this.auth.eraseJwt(jwt);
  }
}
