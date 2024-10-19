import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
} from 'class-validator';

export class CreateSupplierDto {
  @IsNotEmpty()
  @IsString()
  companyName: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsStrongPassword({
    minLength: 6,
    minLowercase: 0,
  })
  password: string;

  @IsNotEmpty()
  @IsString()
  //Todo @IsCnpj() -> fazer decorator para o cnpj
  cnpj: string;

  @IsNotEmpty()
  //Todo @IsPhoneNumber() -> fazer decorator para o telefone
  @IsString()
  phoneNumber: string;

  @IsNotEmpty()
  @IsString()
  address: string;
}
