import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Contrato de renovação de sessão de usuário/fornecedor.
 * A validade criptográfica e a existência da sessão são verificadas no service.
 */
export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  refreshToken: string;
}
