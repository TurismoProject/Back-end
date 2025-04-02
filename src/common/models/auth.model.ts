export class AuthModel {
  accessToken: string;
  refreshToken: string;
  authId?: string;
  expirationDateRefreshToken?: number;
  message?: string;
}
