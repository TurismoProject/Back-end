import { IsCPF } from '@decorators/cpf.decorator';
import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsStrongPassword({
    minLength: 6,
    minLowercase: 0,
  })
  password: string;

  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  @IsCPF()
  cpf: string;

  @IsDateString({ strict: true })
  @IsNotEmpty()
  birthday: string;

  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @IsNotEmpty()
  @IsString()
  address: string;
}
