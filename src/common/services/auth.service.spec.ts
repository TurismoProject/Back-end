import { JwtService } from '@nestjs/jwt';
import { generateKeyPairSync, randomUUID } from 'crypto';
import { Role } from '@prisma/client';
import { AuthService } from './auth.service';

const keys = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

describe('AuthService token separation', () => {
  const jwt = new JwtService({ ...keys, signOptions: { algorithm: 'RS256' } });
  const service = new AuthService(jwt);
  const user = {
    id: randomUUID(),
    email: 'tourist@example.com',
    role: Role.User,
  };

  it('issues distinct short-lived access tokens and seven-day refresh tokens', () => {
    const result = service.generateTokens(user);
    const access = jwt.verify(result.accessToken);
    const refresh = jwt.verify(result.refreshToken);
    expect(access.tokenUse).toBe('access');
    expect(access.exp - access.iat).toBe(900);
    expect(refresh.tokenUse).toBe('refresh');
    expect(refresh.exp - refresh.iat).toBe(604800);
    expect(access.jti).not.toBe(refresh.jti);
    expect(service.generateTokens(user).refreshToken).not.toBe(
      result.refreshToken
    );
  });
  it('rejects use of a refresh token as access and vice versa', () => {
    const tokens = service.generateTokens(user);
    expect(() => service.validateAccessToken(tokens.refreshToken)).toThrow();
    expect(() => service.validateRefreshToken(tokens.accessToken)).toThrow();
  });
  it('preserves the subject when renewing access', () => {
    const tokens = service.generateTokens(user);
    const renewed = service.regenerateAccessToken(tokens.refreshToken);
    expect(service.validateAccessToken(renewed.token).sub).toBe(user.id);
  });
});
