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

<<<<<<< Updated upstream
    async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
        try {
            const { id, name, emails, photos } = profile;
            const email = emails && emails.length > 0 ? emails[0].value : null;

            if (!email) {
                return done(new UnauthorizedException('E-mail não fornecido pelo Google'), false);
            }
=======
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const { id, name, emails, photos } = profile;
      const email = emails && emails.length > 0 ? emails[0].value : null;

      if (!email) {
        return done(
          new UnauthorizedException('E-mail não fornecido pelo Google'),
          false,
        );
      }
>>>>>>> Stashed changes

            const displayName =
                profile.displayName ||
                [name?.givenName, name?.familyName].filter(Boolean).join(' ') ||
                'Usuário';

<<<<<<< Updated upstream
            const user = {
                googleId: id,
                email,
                name: displayName,
                picture: photos && photos.length > 0 ? photos[0].value : null,
                accessToken,
            };
            return done(null, user);
        } catch (error) {
            return done(new UnauthorizedException('Erro ao autenticar com o Google'), false);
        }
=======
      const user = {
        googleId: id,
        email,
        name: displayName,
        picture: photos && photos.length > 0 ? photos[0].value : null,
        accessToken,
      };
      return done(null, user);
    } catch (error) {
      return done(
        new UnauthorizedException('Erro ao autenticar com o Google'),
        false,
      );
>>>>>>> Stashed changes
    }
}
