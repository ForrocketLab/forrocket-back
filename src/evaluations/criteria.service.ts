import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Criterion, CriterionPillar } from '@prisma/client';

import { PrismaService } from '../database/prisma.service';
import { CreateCriterionDto, UpdateCriterionDto, CriterionDto } from './dto/criteria.dto';
import { BusinessUnit } from '../common/enums/business-unit.enum';

@Injectable()
export class CriteriaService {
  constructor(private prisma: PrismaService) {}

  /**
   * Lista todos os critérios (todos sempre visíveis no formulário)
   */
  async findAll(): Promise<CriterionDto[]> {
    const criteria = await this.prisma.criterion.findMany({
      orderBy: [{ pillar: 'asc' }, { name: 'asc' }],
    });

    return criteria.map((criterion) => this.mapToDto(criterion));
  }

  /**
   * Lista critérios específicos de uma unidade de negócio ou gerais
   */
  async findByBusinessUnit(businessUnit: string): Promise<CriterionDto[]> {
    const criteria = await this.prisma.criterion.findMany({
      where: {
        OR: [
          { businessUnit: businessUnit },
          { businessUnit: null }, // Critérios gerais
        ],
      },
      orderBy: [{ pillar: 'asc' }, { name: 'asc' }],
    });

    return criteria.map(this.mapToDto);
  }

  /**
   * Lista critérios obrigatórios
   */
  async findRequired(): Promise<CriterionDto[]> {
    const criteria = await this.prisma.criterion.findMany({
      where: { isRequired: true },
      orderBy: [{ pillar: 'asc' }, { name: 'asc' }],
    });

    return criteria.map((criterion) => this.mapToDto(criterion));
  }

  /**
   * Lista critérios opcionais
   */
  async findOptional(): Promise<CriterionDto[]> {
    const criteria = await this.prisma.criterion.findMany({
      where: { isRequired: false },
      orderBy: [{ pillar: 'asc' }, { name: 'asc' }],
    });

    return criteria.map((criterion) => this.mapToDto(criterion));
  }

  /**
   * Lista critérios baseados no papel do usuário e sua unidade de negócio
   * - Gestores: todos os critérios (incluindo MANAGEMENT) aplicáveis à sua businessUnit
   * - Outros: critérios exceto MANAGEMENT aplicáveis à sua businessUnit
   */
  async findForUserRole(isManager: boolean, businessUnit?: string): Promise<CriterionDto[]> {
    // Buscar critérios válidos: base (isBase: true) + específicos da businessUnit
    const criteria = await this.prisma.criterion.findMany({
      where: {
        OR: [
          // Critérios base (aplicam para todos)
          { isBase: true },
          // Critérios específicos da businessUnit do usuário (se fornecida)
          ...(businessUnit ? [{ businessUnit: businessUnit }] : []),
        ],
      },
      orderBy: [{ pillar: 'asc' }, { name: 'asc' }],
    });

    // Filtrar critérios baseado no papel do usuário
    const filteredCriteria = criteria.filter((criterion) => {
      // Critérios de gestão apenas para gestores
      if (criterion.pillar === CriterionPillar.MANAGEMENT) {
        return isManager;
      }
      // Todos os outros critérios são aplicáveis
      return true;
    });

    return filteredCriteria.map((criterion) => this.mapToDto(criterion));
  }

  /**
   * Lista critérios obrigatórios por unidade de negócio
   */
  async findRequiredByBusinessUnit(businessUnit: string): Promise<CriterionDto[]> {
    const criteria = await this.prisma.criterion.findMany({
      where: {
        isRequired: true,
        OR: [
          { businessUnit: businessUnit },
          { businessUnit: null }, // Critérios gerais
        ],
      },
      orderBy: [{ pillar: 'asc' }, { name: 'asc' }],
    });

    return criteria.map(this.mapToDto);
  }

  /**
   * Lista critérios opcionais por unidade de negócio
   */
  async findOptionalByBusinessUnit(businessUnit: string): Promise<CriterionDto[]> {
    const criteria = await this.prisma.criterion.findMany({
      where: {
        isRequired: false,
        OR: [
          { businessUnit: businessUnit },
          { businessUnit: null }, // Critérios gerais
        ],
      },
      orderBy: [{ pillar: 'asc' }, { name: 'asc' }],
    });

    return criteria.map(this.mapToDto);
  }

  /**
   * Busca um critério por ID
   */
  async findOne(id: string): Promise<CriterionDto> {
    const criterion = await this.prisma.criterion.findUnique({
      where: { id },
    });

    if (!criterion) {
      throw new NotFoundException(`Critério com ID ${id} não encontrado`);
    }

    return this.mapToDto(criterion);
  }

  /**
   * NOVO MÉTODO: Busca um critério por nome
   */
  async findByName(name: string): Promise<CriterionDto | null> {
    const criterion = await this.prisma.criterion.findFirst({
      where: { name: name },
    });
    return criterion ? this.mapToDto(criterion) : null;
  }

  /**
   * Cria um novo critério
   */
  async create(createCriterionDto: CreateCriterionDto): Promise<CriterionDto> {
    // Verificar se já existe um critério com o mesmo nome
    const existingCriterion = await this.prisma.criterion.findFirst({
      where: {
        name: createCriterionDto.name,
      },
    });

    if (existingCriterion) {
      throw new ConflictException(`Já existe um critério com o nome "${createCriterionDto.name}"`);
    }

    // Gerar ID único baseado no nome
    const id = this.generateCriterionId(createCriterionDto.name);

    // Lógica para isBase/businessUnit
    let isBase = true;
    let businessUnit = createCriterionDto.businessUnit ?? null;
    if (businessUnit) {
      isBase = false;
    }

    const criterion = await this.prisma.criterion.create({
      data: {
        id,
        name: createCriterionDto.name,
        description: createCriterionDto.description,
        pillar: createCriterionDto.pillar,
        weight: createCriterionDto.weight ?? 1.0,
        isRequired: createCriterionDto.isRequired ?? true,
        businessUnit,
        isBase,
      },
    });

    return this.mapToDto(criterion);
  }

  /**
   * Atualiza um critério existente
   */
  async update(id: string, updateCriterionDto: UpdateCriterionDto): Promise<CriterionDto> {
    const existingCriterion = await this.prisma.criterion.findUnique({
      where: { id },
    });

    if (!existingCriterion) {
      throw new NotFoundException(`Critério com ID ${id} não encontrado`);
    }

    // Verificar se o novo nome já existe (se estiver sendo alterado)
    if (updateCriterionDto.name && updateCriterionDto.name !== existingCriterion.name) {
      const nameConflict = await this.prisma.criterion.findFirst({
        where: {
          name: updateCriterionDto.name,
          id: { not: id },
        },
      });

      if (nameConflict) {
        throw new ConflictException(
          `Já existe um critério com o nome "${updateCriterionDto.name}"`,
        );
      }
    }

    const updatedCriterion = await this.prisma.criterion.update({
      where: { id },
      data: {
        ...updateCriterionDto,
        updatedAt: new Date(),
      },
    });

    return this.mapToDto(updatedCriterion);
  }

  /**
   * Remove um critério permanentemente
   */
  async remove(id: string): Promise<void> {
    const criterion = await this.prisma.criterion.findUnique({
      where: { id },
    });

    if (!criterion) {
      throw new NotFoundException(`Critério com ID ${id} não encontrado`);
    }

    // Verificar se o critério está sendo usado em avaliações
    const usageCount = await this.checkCriterionUsage(id);

    if (usageCount > 0) {
      throw new BadRequestException(
        `Não é possível remover o critério "${criterion.name}" pois ele está sendo usado em ${usageCount} avaliação(ões). Para manter histórico, altere a obrigatoriedade ao invés de remover.`,
      );
    }

    // Se não está sendo usado, pode ser removido permanentemente
    await this.prisma.criterion.delete({
      where: { id },
    });
  }

  /**
   * Alterna a obrigatoriedade de um critério (toggle isRequired)
   */
  async toggleRequired(id: string): Promise<CriterionDto> {
    const criterion = await this.prisma.criterion.findUnique({
      where: { id },
    });

    if (!criterion) {
      throw new NotFoundException(`Critério com ID ${id} não encontrado`);
    }

    // Inverte o valor atual de isRequired
    const newIsRequired = !criterion.isRequired;

    const updatedCriterion = await this.prisma.criterion.update({
      where: { id },
      data: {
        isRequired: newIsRequired,
        updatedAt: new Date(),
      },
    });

    return this.mapToDto(updatedCriterion);
  }

  /**
   * Lista critérios por pilar
   */
  async findByPillar(pillar: CriterionPillar): Promise<CriterionDto[]> {
    const criteria = await this.prisma.criterion.findMany({
      where: {
        pillar: pillar,
      },
      orderBy: { name: 'asc' },
    });

    return criteria.map((criterion) => this.mapToDto(criterion));
  }

  /**
   * Lista critérios efetivos para uma unidade de negócio:
   * - Critérios base (isBase: true, businessUnit: null)
   * - Critérios específicos da unidade (isBase: false, businessUnit: X)
   * - Remove critérios do base que estejam na tabela RemovedCriterion para a unidade
   */
  async findEffectiveByBusinessUnit(businessUnit: string): Promise<CriterionDto[]> {
    // Busca todos os critérios base (isBase: true, businessUnit null ou undefined)
    const baseCriteria = await this.prisma.criterion.findMany({
      where: { isBase: true },
      orderBy: [{ pillar: 'asc' }, { name: 'asc' }],
    });
    // Busca todos os critérios específicos da unidade
    const specificCriteria = await this.prisma.criterion.findMany({
      where: { isBase: false, businessUnit },
      orderBy: [{ pillar: 'asc' }, { name: 'asc' }],
    });
    // Busca critérios removidos
    const removed = await this.prisma.removedCriterion.findMany({
      where: { businessUnit },
    });
    const removedIds = new Set(removed.map((r) => r.criterionId));
    // Filtra base removidos e só pega os que realmente são base (businessUnit null, undefined ou string vazia)
    const filteredBase = baseCriteria.filter(
      (c) =>
        (!c.businessUnit || c.businessUnit === null || c.businessUnit === '') &&
        !removedIds.has(c.id),
    );
    console.log('BASE CRITÉRIOS FILTRADOS:', filteredBase);
    console.log('ESPECÍFICOS:', specificCriteria);
    const result = [...filteredBase, ...specificCriteria].map(this.mapToDto);
    console.log('RESULTADO FINAL:', result);
    return result;
  }

  /**
   * Remove um critério base de uma unidade de negócio (adiciona em RemovedCriterion)
   */
  async removeFromUnit(criterionId: string, businessUnit: string): Promise<void> {
    await this.prisma.removedCriterion.upsert({
      where: { criterionId_businessUnit: { criterionId, businessUnit } },
      update: { removedAt: new Date() },
      create: { criterionId, businessUnit },
    });
  }

  /**
   * Restaura um critério base em uma unidade de negócio (remove de RemovedCriterion)
   */
  async restoreToUnit(criterionId: string, businessUnit: string): Promise<void> {
    await this.prisma.removedCriterion.deleteMany({
      where: { criterionId, businessUnit },
    });
  }

  /**
   * Gera um ID único baseado no nome do critério
   */
  private generateCriterionId(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-') // Remove hífens duplicados
      .replace(/^-|-$/g, ''); // Remove hífens no início/fim
  }

  /**
   * Verifica quantas avaliações usam um critério específico
   */
  private async checkCriterionUsage(criterionId: string): Promise<number> {
    const [selfAssessmentCount, managerAssessmentCount] = await Promise.all([
      this.prisma.selfAssessmentAnswer.count({
        where: { criterionId },
      }),
      this.prisma.managerAssessmentAnswer.count({
        where: { criterionId },
      }),
    ]);

    return selfAssessmentCount + managerAssessmentCount;
  }

  /**
   * Mapeia um critério do Prisma para DTO
   */
  private mapToDto(criterion: any): CriterionDto {
    return {
      id: criterion.id,
      name: criterion.name,
      description: criterion.description,
      pillar: criterion.pillar,
      weight: criterion.weight,
      isRequired: criterion.isRequired,
      businessUnit: criterion.businessUnit,
      isBase: criterion.isBase,
      createdAt: criterion.createdAt,
      updatedAt: criterion.updatedAt,
    };
  }
}
