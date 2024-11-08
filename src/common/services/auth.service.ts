import { PrismaService } from '@database/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  private async findUserByEmail(email: string) {
    const models = ['admin', 'usuario', 'fornecedor'];

    for (const model of models) {
      const user = await this.prisma[model].findUnique({
        where: { email },
        include: { role: true },
      });
      if (user) {
        return { user, model };
      } else {
        throw new NotFoundException('usuario nao cadastrado');
      }
    }
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const result = await this.findUserByEmail(email);
    const isValidUser = await bcrypt.compare(pass, result.user.password);

    if (isValidUser) {
      const { user, model } = result;
      const data = {
        userId: user.id,
        email: user.email,
        role: user.role.name,
        modelType: model,
      };
      return data;
    } else {
      throw new UnauthorizedException('Credenciais inválidas');
    }
  }
}
