import { PrismaService } from '@database/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Injectable } from '@nestjs/common';
import { CreateUserDto } from '@dtos/create-user.dto';
import { AbstractUserRepository } from '@repositories/user/abstract-user.repository';
import { CreateAdminDto } from '@dtos/create-admin.dto';
import { CreateSupplierDto } from '@dtos/create-supplier.dto';
import { AbstractAdminRepository } from '@repositories/admin/abstract-admin.repository';
import { AbstractSupplierRepository } from '@repositories/suppliers/abstract-supplier.repository';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {

  private static readonly errorMessage: string = 'Email e/ou senha inválidos';

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private userRepository: AbstractUserRepository,
    private adminRepository: AbstractAdminRepository,
    // private supplierService: AbstractSupplierRepository
  ) { }

  private generateJwtToken(
    user: any,
    expiration: string = '15m'
  ) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role?.name,
    };

    const token = this.jwtService.sign(payload, { expiresIn: expiration });
    return token;
  }

  private async generateRefreshToken(user: any, expiration: string = '7d') {
    const token = this.generateJwtToken(user, '7d');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // await this.prisma.refreshToken.create({
    //   data: {
    //     token,
    //     userId: user.id,
    //     expiresAt,
    //   },
    // });

    return token;
  }

  public async generateTokens(user: any) {
    const accessToken = this.generateJwtToken(user, '15m');
    const refreshToken = this.generateRefreshToken(user, '1d',);
    const tokens = {
      accessToken,
      refreshToken,
    };

    return tokens;
  }

  async validateUser(email: string, password: string): Promise<User> {
    const findedUser = await this.userRepository.findByEmail(email);
    if (!findedUser) {
      throw new Error(AuthService.errorMessage);
    }
    const isValidUser = await bcrypt.compare(password, findedUser.password);
    if (!isValidUser) {
      throw new Error(AuthService.errorMessage);
    }
    return findedUser;
  }

  async validateAdmin(email: string, password: string): Promise<any> {
    const findedAdmin = await this.adminRepository.findByEmail(email);
    if (!findedAdmin) {
      throw new Error(AuthService.errorMessage);
    }
    return findedAdmin;
  }
}
