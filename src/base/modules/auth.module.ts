import { LocalStrategy } from '@common/guards/strategies/local.strategy';
import { DatabaseModule } from '@modules/database.module';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtGeneratorService } from '@services/jwt-gen.service';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AbstractAuthenticateRepository } from '@repositories/auth/abstract-authenticate.repository';
import { AuthenticateRepository } from '@repositories/auth/authenticate.repository';
import { JwtStrategy } from '@common/guards/strategies/jwt.strategy';
// import { RolesGuard } from '@common/guards/roles.guard';
import { JwtAuthGuard } from '@common/guards/jwt.guard';

@Module({
  imports: [
    DatabaseModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      global: true,
      useFactory: (config: ConfigService) => {
        const privateKey = config.get<string>('JWT_PRIVATE_KEY', {
          infer: true,
        });
        const publicKey = config.get<string>('JWT_PUBLIC_KEY', { infer: true });
        return {
          privateKey: Buffer.from(privateKey, 'base64'),
          publicKey: Buffer.from(publicKey, 'base64'),
          signOptions: { algorithm: 'RS256' },
        };
      },
    }),
  ],
  providers: [
    JwtGeneratorService,
    // LocalStrategy,
    JwtStrategy,
    JwtAuthGuard,
    // RolesGuard,
    {
      provide: AbstractAuthenticateRepository,
      useClass: AuthenticateRepository,
    },
  ],
  controllers: [],
  exports: [JwtGeneratorService, AbstractAuthenticateRepository],
})
export class AuthModule {}
