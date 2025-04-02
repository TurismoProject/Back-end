import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import validator from 'validator';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly configService: ConfigService) {
        const publicKey = configService.get<string>('JWT_PUBLIC_KEY', { infer: true, });
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: Buffer.from(publicKey, 'base64'),
            algorithms: ['RS256'],
        });
    }

    async validate(payload: any) {

        if (!payload || !validator.isUUID(payload.sub)) {
            throw new UnauthorizedException();
        }

        const validPayload = {
            userId: payload.sub,
            username: payload.username
        };

        return validPayload;
    }

}
