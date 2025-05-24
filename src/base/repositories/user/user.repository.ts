import { PrismaService } from '@database/prisma/prisma.service';
import { JwtGeneratorService } from '@services/jwt-gen.service';
import { CreateUserDto } from '@dtos/create-user.dto';
import { UpdateUserDto } from '@dtos/update-user.dto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { AbstractUserRepository } from './abstract-user.repository';
import { AuthModel } from '@common/models/auth.model';
import { AbstractAuthenticateRepository } from '@repositories/auth/abstract-authenticate.repository';
import { CreateUserWithGoogleDto } from '@dtos/create-user-google.dto';
import { GoogleAuthentication } from '@common/models/user-google-authenticate.model';
import { BaseAuthRepository } from '@common/repositories/base.repository';

@Injectable()
export class UserRepository
  extends BaseAuthRepository<User, CreateUserDto, UpdateUserDto>
  implements AbstractUserRepository
{
  constructor(
    protected readonly prismaService: PrismaService,
    protected readonly jwtGenService: JwtGeneratorService,
    protected readonly authRepository: AbstractAuthenticateRepository
  ) {
    super(prismaService, authRepository, jwtGenService);
  }

  protected get model() {
    return this.prismaService.user;
  }

  async createWithGoogle(
    user: CreateUserWithGoogleDto
  ): Promise<GoogleAuthentication> {
    try {
      const createdUserWithGoogle = await this.model.create({
        data: {
          email: user.email,
          name: user.name,
          googleId: user.googleId,
          password: '',
          cpf: '',
          birthday: '',
          phoneNumber: '',
          address: '',
        },
      });
      const token = this.jwtGenService.generateTokens(createdUserWithGoogle);

      const authData: AuthModel = {
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        authId: createdUserWithGoogle.id,
        expirationDateRefreshToken: token.expirationDateRefreshToken,
      };

      await this.authRepository.authenticate(authData, Role.USER);

      return {
        user: createdUserWithGoogle,
        token: token.accessToken,
      };
    } catch (error) {
      throw new ConflictException(
        `Erro ao criar o usuário com google: ${error.message}`
      );
    }
  }

  async loginWithGoogle(
    user: CreateUserWithGoogleDto
  ): Promise<GoogleAuthentication> {
    try {
      const existingUser = await this.findByEmail(user.email);

      if (!existingUser || existingUser.googleId !== user.googleId) {
        throw new NotFoundException('Usuário não foi encontrado.');
      }

      const token = this.jwtGenService.generateTokens(existingUser).accessToken;

      return {
        user: existingUser,
        token,
      };
    } catch (error) {
      throw new UnauthorizedException(
        `Erro ao fazer login com Google: ${error.message}`
      );
    }
  }

  async emailInUse(email: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    return !!user;
  }

  async phoneInUse(phoneNumber: string): Promise<boolean> {
    const user = await this.prismaService.user.findUnique({
      where: {
        phoneNumber,
      },
    });

    return !!user;
  }

  async cpfInUse(cpf: string): Promise<boolean> {
    const user = await this.prismaService.user.findUnique({
      where: {
        cpf,
      },
    });

    return !!user;
  }

  async create(user: CreateUserDto): Promise<User> {
    await this.validateBirthDate(user.birthday);

    const userData = {
      ...user,
      birthday: new Date(user.birthday).toISOString().split('T')[0],
    };

    try {
      return await super.create(userData);
    } catch (error) {
      throw new ConflictException(`Erro ao criar o usuário: ${error.message}`);
    }
  }

  private async validateBirthDate(birthDate: string): Promise<boolean> {
    const date = new Date(birthDate);

    if (isNaN(date.getTime())) {
      throw new BadRequestException('data de nascimento inválida');
    }

    if (date > new Date()) {
      throw new BadRequestException('data de nascimento inválida');
    }

    const age = await this.calculateAge(date);
    if (age < 18) {
      throw new BadRequestException(
        'O usuário deve ter pelo menos 18 anos para se cadastrar!'
      );
    }

    return true;
  }

  private async calculateAge(birthDate: Date): Promise<number> {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    const validBirth =
      monthDifference < 0 ||
      (monthDifference === 0 && today.getDate() < birthDate.getDate());
    if (validBirth) {
      age--;
    }
    return age;
  }
}
