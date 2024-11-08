import { LocalStrategy } from '@common/guards/strategies/local.strategy';
import { AuthController } from '@controllers/auth.controller';
import { DatabaseModule } from '@modules/database.module';
import { UserModule } from '@modules/user.module';
import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from '@services/auth.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JwtKeyConstant,
      signOptions: { expiresIn: '15m' },
    }),
    forwardRef(() => UserModule),
    DatabaseModule,
  ],
  providers: [AuthService, AuthGuard, LocalStrategy],
  controllers: [AuthController],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}
