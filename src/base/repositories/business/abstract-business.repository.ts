import { AuthModel } from '@common/models/auth.model';
import {
  AbstractBaseAuthRepository,
  AbstractBaseRepository,
} from '@common/repositories/abstract-base.repository';
import { CreateBusinessClientDto } from '@dtos/create-business-client.dto';
import { UpdateBusinessClientDto } from '@dtos/update-business-client.dto';
import { BusinessClient } from '@prisma/client';

export abstract class AbstractBusinessRepository
  extends AbstractBaseRepository<
    BusinessClient,
    CreateBusinessClientDto,
    UpdateBusinessClientDto
  >
  implements AbstractBaseAuthRepository<BusinessClient>
{
  // Core Methods (from AbstractBaseRepository)

  abstract create(data: CreateBusinessClientDto): Promise<BusinessClient>;

  /**
   * Find a business client by ID
   * @param id The business client ID
   * @returns The found business client
   */
  abstract findById(id: string): Promise<BusinessClient>;

  /**
   * Find a business client by email
   * @param email The business client email
   * @returns The found business client
   */
  abstract findByEmail: (email: string) => Promise<BusinessClient>;

  /**
   * Find all business clients
   * @returns Array of business clients
   */
  abstract findAll(): Promise<BusinessClient[]>;

  /**
   * Update a business client
   * @param id The business client ID
   * @param businessClient The business client data
   * @returns The updated business client
   */
  abstract update(
    id: string,
    data: UpdateBusinessClientDto
  ): Promise<BusinessClient>;

  /**
   * Delete a business client
   * @param id The business client ID
   * @returns The deleted business client
   */
  abstract delete(id: string): Promise<BusinessClient>;

  // Authentication methods (from AbstractAuthRepository)
  /**
   * Login a business client
   * @param email The business client email
   * @param password The business client password
   * @returns Authentication model with tokens
   */
  abstract login(email: string, password: string): Promise<AuthModel>;

  /**
   * Get a business client by JWT
   * @param jwt The JWT token
   * @returns The business client
   */
  abstract getByJwt(jwt: string): Promise<BusinessClient>;

  abstract refreshAccessToken(jwt: string): Promise<AuthModel>;

  /**
   * Logout a business client
   * @param jwt The business client jwt to be invalidated
   */
  abstract logout(jwt: string): Promise<void>;
}
