import {
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
} from 'class-validator';
import { TransformDate } from 'src/utils/utils';

export class CreateUserDto {
  id: any;
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsStrongPassword({
    minLength: 6,
    minLowercase: 0,
  })
  senha: string;

  @IsString()
  nome: string;

  @IsNotEmpty()
  @IsString()
  //Todo @IsCpf() -> fazer decorator para o cpf
  cpf: string;

  //TODO corrigir error: Invalid value for argument `dataNascimento`: input contains invalid characters. Expected ISO-8601 DateTime.
  @TransformDate()
  @IsNotEmpty()
  @IsDate()
  dataNascimento: Date;

  @IsNotEmpty()
  @IsString()
  telefone: string;

  @IsNotEmpty()
  @IsString()
  endereco: string;
}
