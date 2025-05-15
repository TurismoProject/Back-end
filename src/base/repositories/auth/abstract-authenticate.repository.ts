import { AuthResetPassModel } from '@common/models/auth-resetpass.model';
import { AuthModel } from '@common/models/auth.model';
import { AdminJWTs, SupplierJWTs, UserJWTs } from '@prisma/client';

export abstract class AbstractAuthenticateRepository {
  abstract authenticateUser(authData: AuthModel): Promise<UserJWTs>;
  abstract savingRecoveryToken(authData: AuthResetPassModel): Promise<UserJWTs>
  abstract authenticateAdmin(authData: AuthModel): Promise<AdminJWTs>;
  abstract authenticateSupplier(authData: AuthModel): Promise<SupplierJWTs>;
  abstract searchUserJWT(jwt: string): Promise<UserJWTs>;
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
}
