import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Put } from '@nestjs/common';
import { PDIsService } from './pdis.service';
import { CreatePDIDto } from './dto/create-pdi.dto';
import { UpdatePDIDto } from './dto/update-pdi.dto';
import { UpdatePDIActionDto } from './dto/update-pdi-action.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../auth/entities/user.entity';
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('PDIs')
@ApiBearerAuth()
@Controller('api/pdis')
@UseGuards(JwtAuthGuard)
export class PDIsController {
  constructor(private readonly pdisService: PDIsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo PDI' })
  @ApiBody({
    type: CreatePDIDto,
    examples: {
      pdiExample1: {
        summary: 'PDI - Desenvolvimento Técnico',
        value: {
          title: "Desenvolvimento em Arquitetura de Software",
          description: "Plano de desenvolvimento focado em aprimorar conhecimentos em arquitetura de software e práticas de desenvolvimento",
          startDate: "2024-03-20T00:00:00.000Z",
          endDate: "2024-12-31T00:00:00.000Z",
          actions: [
            {
              title: "Certificação em Cloud Architecture",
              description: "Obter certificação AWS Solutions Architect",
              deadline: "2024-06-30T00:00:00.000Z",
              priority: "HIGH"
            },
            {
              title: "Curso de Design Patterns",
              description: "Completar curso avançado de padrões de projeto",
              deadline: "2024-08-30T00:00:00.000Z",
              priority: "MEDIUM"
            }
          ]
        }
      },
      pdiExample2: {
        summary: 'PDI - Liderança',
        value: {
          title: "Desenvolvimento de Habilidades de Liderança",
          description: "Plano focado em desenvolver competências de liderança e gestão de equipes",
          startDate: "2024-04-01T00:00:00.000Z",
          endDate: "2024-12-31T00:00:00.000Z",
          actions: [
            {
              title: "Mentoria com Líder Sênior",
              description: "Sessões mensais de mentoria com líder experiente",
              deadline: "2024-07-31T00:00:00.000Z",
              priority: "HIGH"
            },
            {
              title: "Curso de Gestão de Conflitos",
              description: "Participar de treinamento em resolução de conflitos",
              deadline: "2024-09-30T00:00:00.000Z",
              priority: "MEDIUM"
            }
          ]
        }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'PDI criado com sucesso' })
  create(@CurrentUser() user: User, @Body() createPdiDto: CreatePDIDto) {
    return this.pdisService.create(user.id, createPdiDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os PDIs do usuário' })
  @ApiResponse({ status: 200, description: 'Lista de PDIs retornada com sucesso' })
  findAll(@CurrentUser() user: User) {
    return this.pdisService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar um PDI específico' })
  @ApiResponse({ status: 200, description: 'PDI encontrado' })
  @ApiResponse({ status: 404, description: 'PDI não encontrado' })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.pdisService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar um PDI' })
  @ApiBody({
    type: UpdatePDIDto,
    examples: {
      updateExample: {
        summary: 'Atualização de PDI',
        value: {
          title: "Desenvolvimento em Arquitetura de Software [Atualizado]",
          description: "Plano atualizado com novo foco em microserviços",
          actions: [
            {
              id: "action-id-existente",
              title: "Certificação AWS [Atualizada]",
              description: "Obter certificação AWS Solutions Architect - atualizado",
              deadline: "2024-08-30T00:00:00.000Z",
              priority: "HIGH"
            },
            {
              title: "Nova Ação - Estudo de Microserviços",
              description: "Implementar projeto prático usando arquitetura de microserviços",
              deadline: "2024-09-30T00:00:00.000Z",
              priority: "MEDIUM"
            }
          ]
        }
      },
      updateWithoutActions: {
        summary: 'Atualizar apenas dados do PDI',
        value: {
          title: "Título Atualizado",
          description: "Descrição atualizada",
          status: "IN_PROGRESS"
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'PDI atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'PDI não encontrado' })
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updatePdiDto: UpdatePDIDto,
  ) {
    return this.pdisService.update(id, user.id, updatePdiDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover um PDI' })
  @ApiResponse({ status: 200, description: 'PDI removido com sucesso' })
  @ApiResponse({ status: 404, description: 'PDI não encontrado' })
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.pdisService.remove(id, user.id);
  }

  // ==========================================
  // ENDPOINTS PARA GERENCIAR AÇÕES INDIVIDUAIS
  // ==========================================

  @Get('actions/:actionId')
  @ApiOperation({ summary: 'Buscar uma ação específica do PDI' })
  @ApiResponse({ status: 200, description: 'Ação encontrada' })
  @ApiResponse({ status: 404, description: 'Ação não encontrada' })
  findAction(@CurrentUser() user: User, @Param('actionId') actionId: string) {
    return this.pdisService.findAction(actionId, user.id);
  }

  @Patch('actions/:actionId')
  @ApiOperation({ summary: 'Atualizar uma ação específica do PDI' })
  @ApiBody({
    type: UpdatePDIActionDto,
    examples: {
      updateStatus: {
        summary: 'Atualizar status da ação',
        value: {
          status: 'COMPLETED'
        }
      },
      updateAction: {
        summary: 'Atualizar ação completa',
        value: {
          title: 'Título atualizado',
          description: 'Descrição atualizada',
          deadline: '2024-12-31T00:00:00.000Z',
          priority: 'HIGH',
          status: 'IN_PROGRESS'
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Ação atualizada com sucesso' })
  @ApiResponse({ status: 404, description: 'Ação não encontrada' })
  updateAction(
    @CurrentUser() user: User,
    @Param('actionId') actionId: string,
    @Body() updateActionDto: UpdatePDIActionDto,
  ) {
    return this.pdisService.updateAction(actionId, user.id, updateActionDto);
  }

  @Put('actions/:actionId/toggle-status')
  @ApiOperation({ summary: 'Alternar status da ação (TO_DO → IN_PROGRESS → COMPLETED → TO_DO)' })
  @ApiResponse({ status: 200, description: 'Status da ação alterado com sucesso' })
  @ApiResponse({ status: 404, description: 'Ação não encontrada' })
  toggleActionStatus(@CurrentUser() user: User, @Param('actionId') actionId: string) {
    return this.pdisService.toggleActionStatus(actionId, user.id);
  }
} 