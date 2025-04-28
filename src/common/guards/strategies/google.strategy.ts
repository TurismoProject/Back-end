import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('google.clientId'),
      clientSecret: configService.get<string>('google.clientSecret'),
      callbackURL: configService.get<string>('google.callbackUrl'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback
  ): Promise<any> {
    try {
      const { id, name, emails } = profile;
      const user = {
        googleId: id,
        email: emails[0].value,
        name: name.givenName + ' ' + name.familyName,
        accessToken,
      };
      return done(null, user);
    } catch (error) {
      return done(
        new UnauthorizedException('Erro ao autenticar com o Google'),
        false
      );
    }
  }
}
