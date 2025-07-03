import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreatePDIDto } from './dto/create-pdi.dto';
import { UpdatePDIDto } from './dto/update-pdi.dto';
import { UpdatePDIActionDto } from './dto/update-pdi-action.dto';

@Injectable()
export class PDIsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(collaboratorId: string, createPdiDto: CreatePDIDto) {
    return this.prisma.pDI.create({
      data: {
        collaboratorId,
        title: createPdiDto.title,
        description: createPdiDto.description,
        startDate: new Date(createPdiDto.startDate),
        endDate: new Date(createPdiDto.endDate),
        actions: {
          create: createPdiDto.actions.map(action => ({
            title: action.title,
            description: action.description,
            deadline: new Date(action.deadline),
            priority: action.priority,
          })),
        },
      },
      include: {
        actions: true,
      },
    });
  }

  async findAll(collaboratorId: string) {
    const pdis = await this.prisma.pDI.findMany({
      where: { collaboratorId },
      include: {
        actions: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Aplicar lógica de status dinâmico para cada PDI (exceto arquivados)
    return pdis.map(pdi => {
      // Só aplica status dinâmico se não estiver arquivado
      if (pdi.status === 'ARCHIVED') {
        return pdi;
      }
      
      const dynamicStatus = this.calculateDynamicStatus(pdi);
      return {
        ...pdi,
        status: dynamicStatus
      };
    });
  }

  async findOne(id: string, collaboratorId: string) {
    const pdi = await this.prisma.pDI.findFirst({
      where: { 
        id,
        collaboratorId,
      },
      include: {
        actions: true,
      },
    });

    if (!pdi) {
      throw new NotFoundException(`PDI with ID ${id} not found`);
    }

    // Aplicar lógica de status dinâmico (exceto se arquivado)
    if (pdi.status === 'ARCHIVED') {
      return pdi;
    }
    
    const dynamicStatus = this.calculateDynamicStatus(pdi);
    return {
      ...pdi,
      status: dynamicStatus
    };
  }

  async update(id: string, collaboratorId: string, updatePdiDto: UpdatePDIDto) {
    // Primeiro verifica se o PDI existe e pertence ao colaborador
    const existingPDI = await this.findOne(id, collaboratorId);
    
    // Verifica se o PDI não está arquivado (permitir apenas mudanças de status para desarquivamento)
    if (existingPDI.status === 'ARCHIVED' && updatePdiDto.actions) {
      // Se está tentando alterar ações de um PDI arquivado, bloquear
      throw new BadRequestException('Não é possível alterar as ações de um PDI arquivado. Desarquive-o primeiro.');
    }

    // Se não há ações para atualizar, apenas atualiza o PDI
    if (!updatePdiDto.actions) {
      const updatedPDI = await this.prisma.pDI.update({
        where: { id },
        data: {
          title: updatePdiDto.title,
          description: updatePdiDto.description,
          startDate: updatePdiDto.startDate ? new Date(updatePdiDto.startDate) : undefined,
          endDate: updatePdiDto.endDate ? new Date(updatePdiDto.endDate) : undefined,
          status: updatePdiDto.status,
        },
        include: {
          actions: true,
        },
      });

      // Se o PDI foi marcado como COMPLETED, marcar todas as ações como COMPLETED
      if (updatePdiDto.status === 'COMPLETED') {
        await this.prisma.pDIAction.updateMany({
          where: { pdiId: id },
          data: { 
            status: 'COMPLETED',
            completedAt: new Date()
          },
        });

        // Retornar o PDI atualizado com as ações atualizadas
        return this.prisma.pDI.findUnique({
          where: { id },
          include: { actions: true },
        });
      }

      return updatedPDI;
    }

    // Separar ações existentes e novas
    const actionsWithId = updatePdiDto.actions.filter(action => action.id);
    const newActions = updatePdiDto.actions.filter(action => !action.id);

    // Obter IDs das ações existentes no banco
    const existingActionIds = existingPDI.actions.map(action => action.id);
    
    // Filtrar apenas ações que realmente existem no banco
    const validExistingActions = actionsWithId.filter(action => 
      existingActionIds.includes(action.id!)
    );
    
    const validExistingActionIds = validExistingActions.map(action => action.id!);

    // IDs das ações que devem ser removidas (estão no banco mas não na requisição)
    const actionsToRemove = existingActionIds.filter(actionId => 
      !validExistingActionIds.includes(actionId)
    );

    // Usar transação para garantir consistência
    return this.prisma.$transaction(async (prisma) => {
      // 1. Remover ações que não estão mais na lista
      if (actionsToRemove.length > 0) {
        await prisma.pDIAction.deleteMany({
          where: {
            id: { in: actionsToRemove },
            pdiId: id,
          },
        });
      }

      // 2. Atualizar ações existentes válidas
      for (const action of validExistingActions) {
        await prisma.pDIAction.update({
          where: { id: action.id },
          data: {
            ...(action.title !== undefined && { title: action.title }),
            ...(action.description !== undefined && { description: action.description }),
            ...(action.deadline !== undefined && { deadline: new Date(action.deadline) }),
            ...(action.priority !== undefined && { priority: action.priority }),
            ...(action.status !== undefined && { status: action.status }),
          },
        });
      }

      // 3. Criar novas ações
      if (newActions.length > 0) {
        await prisma.pDIAction.createMany({
          data: newActions.map(action => ({
            pdiId: id,
            title: action.title || 'Nova ação',
            description: action.description || 'Descrição da nova ação',
            deadline: action.deadline ? new Date(action.deadline) : new Date(),
            priority: action.priority || 'MEDIUM',
            status: action.status || 'TO_DO',
          })),
        });
      }

      // 4. Atualizar o PDI principal
      const updatedPDI = await prisma.pDI.update({
        where: { id },
        data: {
          title: updatePdiDto.title,
          description: updatePdiDto.description,
          startDate: updatePdiDto.startDate ? new Date(updatePdiDto.startDate) : undefined,
          endDate: updatePdiDto.endDate ? new Date(updatePdiDto.endDate) : undefined,
          status: updatePdiDto.status,
        },
        include: {
          actions: true,
        },
      });

      // 5. Se o PDI foi marcado como COMPLETED, marcar todas as ações como COMPLETED
      if (updatePdiDto.status === 'COMPLETED') {
        await prisma.pDIAction.updateMany({
          where: { pdiId: id },
          data: { 
            status: 'COMPLETED',
            completedAt: new Date()
          },
        });

        // Retornar o PDI atualizado com as ações atualizadas
        return prisma.pDI.findUnique({
          where: { id },
          include: { actions: true },
        });
      }

      return updatedPDI;
    });
  }

  async remove(id: string, collaboratorId: string) {
    // Primeiro verifica se o PDI existe e pertence ao colaborador
    const existingPDI = await this.findOne(id, collaboratorId);
    
    // Verifica se o PDI não está arquivado
    if (existingPDI.status === 'ARCHIVED') {
      throw new BadRequestException('Não é possível excluir um PDI arquivado. Desarquive-o primeiro.');
    }

    // Remove o PDI (as ações serão removidas automaticamente devido ao onDelete: Cascade)
    return this.prisma.pDI.delete({
      where: { id },
    });
  }

  // ==========================================
  // MÉTODOS PARA GERENCIAR AÇÕES INDIVIDUAIS
  // ==========================================

  async findAction(actionId: string, collaboratorId: string) {
    const action = await this.prisma.pDIAction.findFirst({
      where: {
        id: actionId,
        pdi: {
          collaboratorId: collaboratorId
        }
      },
      include: {
        pdi: true
      }
    });

    if (!action) {
      throw new NotFoundException(`PDI Action with ID ${actionId} not found`);
    }

    return action;
  }

  async updateAction(actionId: string, collaboratorId: string, updateActionDto: UpdatePDIActionDto) {
    // Verifica se a ação existe e pertence ao colaborador
    const action = await this.findAction(actionId, collaboratorId);
    
    // Verifica se o PDI não está arquivado
    if (action.pdi.status === 'ARCHIVED') {
      throw new BadRequestException('Não é possível alterar ações de um PDI arquivado. Desarquive o PDI primeiro.');
    }

    const updateData: any = {};

    if (updateActionDto.title !== undefined) {
      updateData.title = updateActionDto.title;
    }
    if (updateActionDto.description !== undefined) {
      updateData.description = updateActionDto.description;
    }
    if (updateActionDto.deadline !== undefined) {
      updateData.deadline = new Date(updateActionDto.deadline);
    }
    if (updateActionDto.priority !== undefined) {
      updateData.priority = updateActionDto.priority;
    }
    if (updateActionDto.status !== undefined) {
      updateData.status = updateActionDto.status;
      
      // Se o status for COMPLETED, adiciona a data de conclusão
      if (updateActionDto.status === 'COMPLETED') {
        updateData.completedAt = new Date();
      } else {
        // Se não for COMPLETED, remove a data de conclusão
        updateData.completedAt = null;
      }
    }

    return this.prisma.pDIAction.update({
      where: { id: actionId },
      data: updateData,
      include: {
        pdi: {
          include: {
            actions: true
          }
        }
      }
    });
  }

  async toggleActionStatus(actionId: string, collaboratorId: string) {
    const action = await this.findAction(actionId, collaboratorId);
    
    // Verifica se o PDI não está arquivado
    if (action.pdi.status === 'ARCHIVED') {
      throw new BadRequestException('Não é possível alterar o status de ações de um PDI arquivado. Desarquive o PDI primeiro.');
    }
    
    let newStatus: string;
    switch (action.status) {
      case 'TO_DO':
        newStatus = 'IN_PROGRESS';
        break;
      case 'IN_PROGRESS':
        newStatus = 'COMPLETED';
        break;
      case 'COMPLETED':
        newStatus = 'TO_DO';
        break;
      case 'BLOCKED':
        newStatus = 'IN_PROGRESS';
        break;
      default:
        newStatus = 'IN_PROGRESS';
    }

    return this.updateAction(actionId, collaboratorId, { status: newStatus as any });
  }

  /**
   * Calcula o status dinâmico do PDI baseado no progresso das ações
   * @param pdi PDI com suas ações
   * @returns Status dinâmico calculado
   */
  private calculateDynamicStatus(pdi: any): string {
    // Se foi marcado manualmente como COMPLETED, manter o status
    if (pdi.status === 'COMPLETED') {
      return pdi.status;
    }

    // Se está ARCHIVED, manter apenas se não há indicação de mudança
    if (pdi.status === 'ARCHIVED') {
      return pdi.status;
    }

    // Se não tem ações, considerar NOT_STARTED
    if (!pdi.actions || pdi.actions.length === 0) {
      return 'NOT_STARTED';
    }

    const totalActions = pdi.actions.length;
    const completedActions = pdi.actions.filter((action: any) => action.status === 'COMPLETED').length;
    const inProgressActions = pdi.actions.filter((action: any) => action.status === 'IN_PROGRESS').length;

    // Se todas as ações estão concluídas, considerar COMPLETED
    if (completedActions === totalActions) {
      return 'COMPLETED';
    }

    // Se há pelo menos uma ação em progresso ou concluída, considerar IN_PROGRESS
    if (completedActions > 0 || inProgressActions > 0) {
      return 'IN_PROGRESS';
    }

    // Se todas as ações estão em TO_DO, considerar NOT_STARTED
    return 'NOT_STARTED';
  }
} 