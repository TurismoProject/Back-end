import { Match } from '@decorators/match-decorator';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UpdatePasswordDto {

    @IsNotEmpty()
    @IsString()
    token: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    newPassword: string;

    @IsNotEmpty()
    @IsString()
    @Match('newPassword', { message: 'A confirmação da nova senha deve ser igual à nova senha' })
    confirmPassword: string;
}
