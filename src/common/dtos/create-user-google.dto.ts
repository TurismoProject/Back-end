import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateUserWithGoogleDto {
    @IsNotEmpty()
    @IsString()
    googleId: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsNotEmpty()
    @IsString()
    name: string;
}
