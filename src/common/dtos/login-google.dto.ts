import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginGoogleDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @IsString()
  googleId: string;
}
