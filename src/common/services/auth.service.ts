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

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private userService: AbstractUserRepository,
    private adminService: AbstractAdminRepository,
    private supplierService: AbstractSupplierRepository
  ) {}

  async register(
    user: CreateUserDto | CreateAdminDto | CreateSupplierDto,
    userRole: string
  ) {
    let createdUser: any;

    if (userRole === 'admin') {
      createdUser = await this.adminService.createAdmin(user as CreateAdminDto);
    } else if (userRole === 'supplier') {
      createdUser = await this.supplierService.create(
        user as CreateSupplierDto
      );
    } else {
      createdUser = await this.userService.create(user as CreateUserDto);
    }

    const token = this.generateTokens(createdUser, userRole);
    return { token, user: createdUser };
  }

  async login(email: string, password: string) {
    const { user, model } = await this.validateUser(email, password);
    const token = this.generateTokens(user, model);
    return { token };
  }

  private async findUserByEmail(email: string) {
    const models = ['admin', 'user', 'supplier'];

    for (const model of models) {
      const user = await this.prisma[model].findUnique({
        where: { email },
      });

      if (user) {
        return { user, model };
      }
    }
  }

  private generateJwtToken(
    user: any,
    model: string,
    expiration: string = '15m'
  ) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role?.name,
      model: model,
    };

    const token = this.jwtService.sign(payload, { expiresIn: expiration });
    return token;
  }

  public async generateTokens(user: any, model: string) {
    const accessToken = this.generateJwtToken(user, model, '15m');
    const refreshToken = this.generateJwtToken(user, model, '7d'); //Todo -> fazer funcao para tratamento do refreshToken e adcionar tabela para os tokens

    return { accessToken, refreshToken };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const errorMessage = 'Email e/ou senha inválidos';
    const findUser = await this.findUserByEmail(email);
    if (!findUser) {
      throw new Error(errorMessage);
    }

    const { user, model } = findUser;
    const isValidUser = await bcrypt.compare(password, user.password);
    if (!isValidUser) {
      throw new Error(errorMessage);
    }
    return { user, model };
  }
}
