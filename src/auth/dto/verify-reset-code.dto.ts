import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyResetCodeDto {
  @ApiProperty({
    description: 'Email do usuário',
    example: 'usuario@example.com',
  })
  @IsNotEmpty({ message: 'O email é obrigatório.' })
  @IsString({ message: 'O email deve ser uma string.' })
  email: string;

  @ApiProperty({
    description: 'Código de redefinição de senha recebido por e-mail',
    example: '123456',
  })
  @IsNotEmpty({ message: 'O código de redefinição é obrigatório.' })
  @IsString({ message: 'O código de redefinição deve ser uma string.' })
  @Length(6, 6, { message: 'O código de redefinição deve ter 6 caracteres.' }) 
  code: string;
}
