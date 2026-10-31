import { AuthResetPassModel } from '@common/models/auth-resetpass.model';
import { AuthModel } from '@common/models/auth.model';
import { AdminJWTs, JwtTokenType, SupplierJWTs, UserJWTs } from '@prisma/client';

export abstract class AbstractAuthenticateRepository {
<<<<<<< Updated upstream
  abstract authenticateUser(authData: AuthModel): Promise<UserJWTs>;
  abstract savingRecoveryToken(authData: AuthResetPassModel): Promise<UserJWTs>
  abstract authenticateAdmin(authData: AuthModel): Promise<AdminJWTs>;
  abstract authenticateSupplier(authData: AuthModel): Promise<SupplierJWTs>;
  abstract searchUserJWT(jwt: string, type?: JwtTokenType): Promise<UserJWTs>;
  abstract searchAdminJWT(jwt: string): Promise<AdminJWTs>;
  abstract searchSupplierJWT(jwt: string): Promise<SupplierJWTs>;
  // temporary
  abstract refreshUserJWT(oldJwt: string, newJwt: string): Promise<UserJWTs>;
  abstract refreshAdminJWT(oldJwt: string, newJwt: string): Promise<AdminJWTs>;
  abstract refreshSupplierJWT(
    oldJwt: string,
    newJwt: string
  ): Promise<SupplierJWTs>;
  //
  abstract eraseUserJWT(jwt: string): Promise<void>;
  abstract eraseAdminJWT(jwt: string): Promise<void>;
  abstract eraseSupplierJWT(jwt: string): Promise<void>;
=======
  // Store JWT tokens
  abstract authenticate(authData: AuthModel, role: Role): Promise<AuthToken>;

  // Save password recovery token
  abstract savingRecoveryToken(
    authData: AuthResetPassModel,
    role?: Role,
  ): Promise<AuthToken>;

  // Find JWT tokens
  abstract searchJwt(
    jwt: string,
    type?: JwtTokenType,
  ): Promise<AuthToken | null>;

  abstract validateJwt(jwt: string): Promise<boolean>;

  // Delete JWT tokens
  abstract eraseJwt(jwt: string): Promise<void>;

  // Refresh JWT tokens
  abstract refreshJwt(oldJwt: string, newJwt: string): Promise<AuthToken>;
>>>>>>> Stashed changes
}
