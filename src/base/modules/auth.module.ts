import { LocalStrategy } from '@common/guards/strategies/local.strategy';
// import { AuthController } from '@controllers/auth.controller';
import { DatabaseModule } from '@modules/database.module';
import { UserModule } from '@modules/user.module';
import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from '@services/auth.service';
import { AdminModule } from './admin.module';
import { PassportModule } from '@nestjs/passport';
import { buffer } from 'stream/consumers';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      global: true,
      useFactory: (config: ConfigService) => {
        const privateKey = config.get<string>('JWT_PRIVATE_KEY');
        const publicKey = config.get<string>('JWT_PUBLIC_KEY');
        return {
          privateKey: Buffer.from(privateKey, 'base64'),
          publicKey: Buffer.from(publicKey, 'base64'),
          signOptions: { algorithm: 'RS256' },
        }
      },

    }),
    forwardRef(() => UserModule),
    forwardRef(() => AdminModule),
    DatabaseModule,
  ],
  providers: [AuthService, LocalStrategy],
  controllers: [],
  exports: [AuthService],
})
export class AuthModule { }


// @Module({
//   imports: [
//     PassportModule,
//     JwtModule.register({
//       secret: process.env.JWT_SECRET,
//       signOptions: { expiresIn: '15m' },
//     }),
//     forwardRef(() => UserModule),
//     forwardRef(() => AdminModule),
//     DatabaseModule,
//   ],
//   providers: [AuthService, LocalStrategy],
//   controllers: [],
//   exports: [AuthService],
// })
// export class AuthModule { }