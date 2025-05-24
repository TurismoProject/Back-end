import { AuthModel } from '@models/auth.model';

/**
 * Abstract base repository interface that defines common CRUD operations
 * This interface can be extended by specific repository interfaces for
  completely custom implementation that doesn't use the standard Prisma-based
  implementation.
 */
export abstract class AbstractBaseRepository<
  T,
  CreateDto,
  UpdateDto,
  HasEmailField extends boolean = boolean,
> {
  /**
   * Create a new entity
   * @param data The data to create the entity with
   */
  abstract create(data: CreateDto): Promise<T>;

  /**
   * Find all entities
   */
  abstract findAll(): Promise<T[]>;

  /**
   * Find an entity by ID
   * @param id The ID of the entity to find
   */
  abstract findById(id: string): Promise<T | null>;

  /**
   * Find an entity by email (for entities with email)
   * @param email The email of the entity to find
   */
  abstract findByEmail: HasEmailField extends true
    ? (email: string) => Promise<T | null>
    : never;

  /**
   * Update an entity
   * @param id The ID of the entity to update
   * @param data The data to update the entity with
   */
  abstract update(id: string, data: UpdateDto): Promise<T>;

  /**
   * Delete an entity
   * @param id The ID of the entity to delete
   */
  abstract delete(id: string): Promise<T | null>;
}

/**
 * Authentication repository interface for entities that support authentication
 */
export abstract class AbstractBaseAuthRepository<T> {
  /**
   * Login with email and password
   * @param email User's email
   * @param password User's password
   */
  abstract login(email: string, password: string): Promise<AuthModel>;

  /**
   * Find entity by JWT token
   * @param jwt JWT token
   */
  abstract getByJwt(jwt: string): Promise<T>;

  /**
   * Refresh JWT Access token
   * @param jwt Refresh token
   */
  abstract refreshAccessToken(jwt: string): Promise<AuthModel>;

  /**
   * Logout user
   * @param jwt JWT token
   */
  abstract logout(jwt: string): Promise<void>;
}
