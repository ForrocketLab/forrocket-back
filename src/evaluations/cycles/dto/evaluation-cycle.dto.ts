import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum, ValidatorConstraint, ValidatorConstraintInterface, Validate, ValidationArguments } from 'class-validator';

// Validador customizado para garantir que uma data é posterior a outra
@ValidatorConstraint({ name: 'IsAfterDate', async: false })
export class IsAfterDateConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (!value) return true; // Se não há valor, não validar (campo opcional)
    
    const [relatedPropertyName] = args.constraints;
    const relatedValue = (args.object as any)[relatedPropertyName];
    
    if (!relatedValue) return true; // Se não há data de referência, não validar
    
    const currentDate = new Date(value);
    const referenceDate = new Date(relatedValue);
    
    return currentDate > referenceDate;
  }

  defaultMessage(args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    return `${args.property} deve ser posterior a ${relatedPropertyName}`;
  }
}

// Validador customizado para garantir sequência lógica de deadlines
@ValidatorConstraint({ name: 'ValidateDeadlineSequence', async: false })
export class ValidateDeadlineSequenceConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const obj = args.object as any;
    
    // Se não há deadlines, não validar
    if (!obj.assessmentDeadline && !obj.managerDeadline && !obj.equalizationDeadline) {
      return true;
    }

    const assessmentDate = obj.assessmentDeadline ? new Date(obj.assessmentDeadline) : null;
    const managerDate = obj.managerDeadline ? new Date(obj.managerDeadline) : null;
    const equalizationDate = obj.equalizationDeadline ? new Date(obj.equalizationDeadline) : null;

    // Validar sequência: assessment < manager < equalization
    if (assessmentDate && managerDate && assessmentDate >= managerDate) {
      return false;
    }
    if (managerDate && equalizationDate && managerDate >= equalizationDate) {
      return false;
    }
    if (assessmentDate && equalizationDate && assessmentDate >= equalizationDate) {
      return false;
    }

    return true;
  }

  defaultMessage() {
    return 'As deadlines devem seguir a sequência: assessmentDeadline < managerDeadline < equalizationDeadline';
  }
}

// Decorator helper para IsAfterDate
export function IsAfterDate(property: string) {
  return Validate(IsAfterDateConstraint, [property]);
}

// Decorator helper para ValidateDeadlineSequence
export function ValidateDeadlineSequence() {
  return Validate(ValidateDeadlineSequenceConstraint);
}

/**
 * DTO para representar um ciclo de avaliação
 */
export class EvaluationCycleDto {
  @ApiProperty({
    description: 'Identificador único do ciclo',
    example: '2025.1',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do ciclo de avaliação',
    example: '2025.1',
  })
  name: string;

  @ApiProperty({
    description: 'Status atual do ciclo',
    example: 'OPEN',
    enum: ['UPCOMING', 'OPEN', 'EQUALIZATION', 'CLOSED'],
  })
  status: 'UPCOMING' | 'OPEN' | 'EQUALIZATION' | 'CLOSED';

  @ApiProperty({
    description: 'Fase atual do ciclo',
    example: 'ASSESSMENTS',
    enum: ['ASSESSMENTS', 'MANAGER_REVIEWS', 'EQUALIZATION'],
  })
  phase: 'ASSESSMENTS' | 'MANAGER_REVIEWS' | 'EQUALIZATION';

  @ApiProperty({
    description: 'Data de início do ciclo',
    example: '2025-01-01T00:00:00.000Z',
    type: 'string',
    format: 'date-time',
    nullable: true,
  })
  startDate: Date | null;

  @ApiProperty({
    description: 'Data de término do ciclo',
    example: '2025-06-30T23:59:59.999Z',
    type: 'string',
    format: 'date-time',
    nullable: true,
  })
  endDate: Date | null;

  @ApiProperty({
    description: 'Prazo para autoavaliações e avaliações 360',
    example: '2025-03-15T23:59:59.999Z',
    type: 'string',
    format: 'date-time',
    nullable: true,
  })
  assessmentDeadline: Date | null;

  @ApiProperty({
    description: 'Prazo para avaliações de gestor',
    example: '2025-04-15T23:59:59.999Z',
    type: 'string',
    format: 'date-time',
    nullable: true,
  })
  managerDeadline: Date | null;

  @ApiProperty({
    description: 'Prazo para equalização do comitê',
    example: '2025-05-15T23:59:59.999Z',
    type: 'string',
    format: 'date-time',
    nullable: true,
  })
  equalizationDeadline: Date | null;

  @ApiProperty({
    description: 'Data de criação do registro',
    example: '2024-12-01T10:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2024-12-01T10:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  updatedAt: Date;
}

/**
 * DTO para criar um novo ciclo de avaliação
 */
export class CreateEvaluationCycleDto {
  @ApiProperty({
    description: 'Nome do ciclo de avaliação',
    example: '2025.2',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Data de início do ciclo',
    example: '2025-07-01T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'Data de término do ciclo (deve ser posterior à data de início)',
    example: '2025-12-31T23:59:59.999Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  @IsAfterDate('startDate')
  endDate?: string;

  @ApiProperty({
    description: 'Prazo para autoavaliações e avaliações 360 (deve ser posterior à data de início)',
    example: '2025-03-15T23:59:59.999Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  @IsAfterDate('startDate')
  assessmentDeadline?: string;

  @ApiProperty({
    description: 'Prazo para avaliações de gestor (deve ser posterior ao prazo de avaliações)',
    example: '2025-04-15T23:59:59.999Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  @IsAfterDate('assessmentDeadline')
  managerDeadline?: string;

  @ApiProperty({
    description: 'Prazo para equalização do comitê (deve ser posterior ao prazo de gestores)',
    example: '2025-05-15T23:59:59.999Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  @IsAfterDate('managerDeadline')
  @ValidateDeadlineSequence()
  equalizationDeadline?: string;
}

/**
 * DTO para ativar um ciclo de avaliação (com deadlines completas)
 */
export class ActivateCycleDto {
  @ApiProperty({
    description: 'Data de início do ciclo',
    example: '2025-01-01T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'Data de término do ciclo (deve ser posterior à data de início)',
    example: '2025-06-30T23:59:59.999Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  @IsAfterDate('startDate')
  endDate?: string;

  @ApiProperty({
    description: 'Prazo para autoavaliações e avaliações 360 (deve ser posterior à data de início)',
    example: '2025-03-15T23:59:59.999Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  @IsAfterDate('startDate')
  assessmentDeadline?: string;

  @ApiProperty({
    description: 'Prazo para avaliações de gestor (deve ser posterior ao prazo de avaliações)',
    example: '2025-04-15T23:59:59.999Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  @IsAfterDate('assessmentDeadline')
  managerDeadline?: string;

  @ApiProperty({
    description: 'Prazo para equalização do comitê (deve ser posterior ao prazo de gestores)',
    example: '2025-05-31T23:59:59.999Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  @IsAfterDate('managerDeadline')
  @ValidateDeadlineSequence()
  equalizationDeadline?: string;

  @ApiProperty({
    description: 'Automatizar fim do ciclo com base na deadline de equalização',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  autoSetEndDate?: boolean;
}

/**
 * DTO para atualizar o status de um ciclo
 */
export class UpdateCycleStatusDto {
  @ApiProperty({
    description: 'Novo status do ciclo',
    example: 'OPEN',
    enum: ['UPCOMING', 'OPEN', 'EQUALIZATION', 'CLOSED'],
  })
  @IsString()
  @IsNotEmpty()
  @IsEnum(['UPCOMING', 'OPEN', 'EQUALIZATION', 'CLOSED'])
  status: 'UPCOMING' | 'OPEN' | 'EQUALIZATION' | 'CLOSED';
}

/**
 * DTO para atualizar a fase de um ciclo
 */
export class UpdateCyclePhaseDto {
  @ApiProperty({
    description: 'Nova fase do ciclo',
    example: 'MANAGER_REVIEWS',
    enum: ['ASSESSMENTS', 'MANAGER_REVIEWS', 'EQUALIZATION'],
  })
  @IsString()
  @IsNotEmpty()
  @IsEnum(['ASSESSMENTS', 'MANAGER_REVIEWS', 'EQUALIZATION'])
  phase: 'ASSESSMENTS' | 'MANAGER_REVIEWS' | 'EQUALIZATION';
}
