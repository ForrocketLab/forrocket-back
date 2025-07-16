import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Email do usuário',
    example: 'usuario@example.com',
  })
  @IsNotEmpty({ message: 'O email é obrigatório.' })
  @IsString({ message: 'O email deve ser uma string.' })
  email: string;

  @ApiProperty({
    description: 'Código de redefinição de senha',
    example: '123456',
  })
  @IsNotEmpty({ message: 'O código de redefinição é obrigatório.' })
  @IsString({ message: 'O código de redefinição deve ser uma string.' })
  code: string;

  @ApiProperty({
    description: 'Nova senha do usuário',
    example: 'NovaSenhaSegura123!',
  })
  @IsNotEmpty({ message: 'A nova senha é obrigatória.' })
  @IsString({ message: 'A nova senha deve ser uma string.' })
  @MinLength(8, { message: 'A nova senha deve ter no mínimo 8 caracteres.' })
  newPassword: string;
}
