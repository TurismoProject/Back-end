import { AuthModel } from '@common/models/auth.model';
import { AuthToken } from '@prisma/client';

export abstract class AbstractAuthenticateRepository {
  // Store JWT tokens
  abstract authenticate(authData: AuthModel, role: string): Promise<AuthToken>;

  // Find JWT tokens
  abstract searchJwt(jwt: string): Promise<AuthToken>;

  abstract validateJwt(jwt: string): Promise<boolean>;

  // Delete JWT tokens
  abstract eraseJwt(jwt: string): Promise<void>;

  // Refresh JWT tokens
  abstract refreshJwt(oldJwt: string, newJwt: string): Promise<AuthToken>;
}
