import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
} from 'class-validator';

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

  @IsDateString({ strict: true })
  @IsNotEmpty()
  dataNascimento: string;

  @IsNotEmpty()
  @IsString()
  telefone: string;

  @IsNotEmpty()
  @IsString()
  endereco: string;
}
