import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { HRRoleGuard } from '../auth/guards/hr-role.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Critérios de Avaliação (Teste)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, HRRoleGuard)
@Controller('api/criteria-test')
export class CriteriaSimpleController {
  @Get()
  @ApiOperation({
    summary: 'Teste simples de critérios',
    description: 'Endpoint de teste para verificar se o controller está funcionando',
  })
  @ApiResponse({
    status: 200,
    description: 'Teste realizado com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Controller funcionando!' },
      },
    },
  })
  async test(): Promise<{ message: string }> {
    return { message: 'Controller de critérios funcionando!' };
  }
}
