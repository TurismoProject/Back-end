import * as bcrypt from 'bcrypt';
import { PrismaService } from '@database/prisma/prisma.service';
import { AuthService } from '@services/auth.service';
import { CreateUserDto } from '@dtos/create-user.dto';
import { UpdateUserDto } from '@dtos/update-user.dto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { AbstractUserRepository } from './abstract-user.repository';
import { AuthModel } from '@common/models/auth.model';
import { AbstractAuthenticateRepository } from '@repositories/auth/abstract-authenticate.repository';
import { CreateUserWithGoogleDto } from '@dtos/create-user-google.dto';
import { GoogleAuthentication } from '@common/models/user-google-authenticate.model';

@Injectable()
export class UserRepository implements AbstractUserRepository {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly authService: AuthService,
    private readonly authRepository: AbstractAuthenticateRepository
  ) {}

  async createWithGoogle(
    user: CreateUserWithGoogleDto
  ): Promise<GoogleAuthentication> {
    try {
      const createdUserWithGoogle = await this.prismaService.user.create({
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
      const token = this.authService.generateTokens(createdUserWithGoogle);

      const authData: AuthModel = {
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        authId: createdUserWithGoogle.id,
        expirationDateRefreshToken: token.expirationDateRefreshToken,
      };

      await this.authRepository.authenticateUser(authData);

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
      const existingUser = await this.prismaService.user.findUnique({
        where: {
          email: user.email,
          AND: {
            googleId: user.googleId,
          },
        },
      });

      if (!existingUser) {
        throw new NotFoundException('Usuário não foi encontrado.');
      }

      const token = this.authService.generateTokens(existingUser).accessToken;

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

  async login(email: string, password: string): Promise<AuthModel> {
    const isValidUser = await this.validateUser(email, password);

    const token = this.authService.generateTokens(isValidUser);

    const authData: AuthModel = {
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      authId: isValidUser.id,
      expirationDateRefreshToken: token.expirationDateRefreshToken,
    };

    await this.authRepository.authenticateUser(authData);

    return {
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
    };
  }

  async logout(jwt: string): Promise<void> {
    await this.authRepository.eraseUserJWT(jwt);
    return;
  }

  async refreshJWT(jwt: string): Promise<AuthModel> {
    const newTokenObj = this.authService.regenerateAccessToken(jwt);

    const authData: AuthModel = {
      accessToken: newTokenObj.token,
      refreshToken: jwt,
    };

    return authData;
  }

  async findByAccessJWT(jwt: string): Promise<User> {
    const payload: { sub: string; email: string } =
      await this.authService.validateAccessToken(jwt);

    const user = await this.findByEmail(payload.email);

    return user;
  }

  async emailInUse(email: string): Promise<boolean> {
    const user = await this.findByEmail(email);

    if (user) return true;

    return false;
  }

  async phoneInUse(phoneNumber: string): Promise<boolean> {
    const user = await this.prismaService.user.findUnique({
      where: {
        phoneNumber,
      },
    });

    if (user) return true;

    return false;
  }

  async cpfInUse(cpf: string): Promise<boolean> {
    const user = await this.prismaService.user.findUnique({
      where: {
        cpf,
      },
    });

    if (user) return true;

    return false;
  }

  async create(user: CreateUserDto): Promise<AuthModel> {
    await this.validateBirthDate(user.birthday);

    const UserData = {
      ...user,
      birthday: new Date(user.birthday).toISOString().split('T')[0],
    };

    try {
      const createdUser = await this.prismaService.user.create({
        data: UserData,
      });

      return this.authService.generateTokens(createdUser);
    } catch (error) {
      throw new ConflictException(`Erro ao criar o usuário: ${error.message}`);
    }
  }

  async findAll(): Promise<User[]> {
    try {
      const users = await this.prismaService.user.findMany();
      return users;
    } catch (error) {
      throw new InternalServerErrorException(
        `Não foi possível buscar os usuários: ${error.message}`
      );
    }
  }

  async findById(id: string): Promise<User> {
    const user = await this.prismaService.user.findUnique({
      where: { id },
    });
    return user;
  }

  async updateUser(id: string, UserData: UpdateUserDto): Promise<User> {
    const existingUser = await this.userExists(id);

    if (existingUser) {
      try {
        const updatedUser = await this.prismaService.user.update({
          where: { id: id },
          data: UserData,
        });
        return updatedUser;
      } catch (error) {
        throw new BadRequestException(
          `Erro ao atualizar o cliente: ${error.message}`
        );
      }
    }
  }

  async deleteUser(id: string): Promise<User> {
    const existingUser = await this.userExists(id);
    if (existingUser) {
      try {
        const deleteUser = await this.prismaService.user.delete({
          where: { id: id },
        });
        return deleteUser;
      } catch (error) {
        throw new BadRequestException(
          `Erro ao deletar o cliente: ${error.message}`
        );
      }
    }
  }

  private async userExists(id: string): Promise<boolean> {
    let validExistUser = false;
    const userStatus = await this.findById(id);

    if (userStatus) {
      validExistUser = true;
    } else {
      throw new NotFoundException(`Usuário não existe`);
    }
    return validExistUser;
  }

  private async findByEmail(email: string): Promise<User> {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { email },
      });

      return user;
    } catch (e) {
      throw new NotFoundException('Usuário não encontrado');
    }
  }

  private async validateUser(email: string, password: string): Promise<User> {
    const findedUser = await this.findByEmail(email);
    if (!findedUser) {
      throw new NotFoundException('Email e/ou senha inválidos');
    }
    const isValidUser = await bcrypt.compare(password, findedUser.password);
    if (!isValidUser) {
      throw new UnauthorizedException('Email e/ou senha inválidos');
    }
    return findedUser;
  }

  private async validateBirthDate(birthDate: string): Promise<boolean> {
    const date = new Date(birthDate);
    let validateBirthUser = true;

    if (isNaN(date.getTime())) {
      validateBirthUser = false;
      throw new BadRequestException('data de nascimento inválida');
    }
    const age = await this.calculateAge(date);
    if (age < 18) {
      validateBirthUser = false;
      throw new BadRequestException(
        'O usuário deve ter pelo menos 18 anos para se cadastrar!'
      );
    }
    return Promise.resolve(validateBirthUser);
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
