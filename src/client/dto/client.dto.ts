import {
  // IsDate,
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
} from 'class-validator';

export class ClientUserDto {
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
  //@IsCpf() -> fazer decorator para o cpf
  cpf: string;

  @IsString()
  // @IsDate()
  dataNascimento: string;

  @IsNotEmpty()
  @IsString()
  telefone: string;

  @IsNotEmpty()
  @IsString()
  endereco: string;
}
