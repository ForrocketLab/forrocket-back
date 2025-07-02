import { Test, TestingModule } from '@nestjs/testing';
import { CommitteeDataService } from './committee-data.service';
import { PrismaService } from '../../database/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('CommitteeDataService', () => {
  let service: CommitteeDataService;
  let prisma: PrismaService;

  const mockPrisma = {
    user: { findUnique: jest.fn() },
    selfAssessment: { findFirst: jest.fn() },
    assessment360: { findMany: jest.fn() },
    managerAssessment: { findMany: jest.fn() },
    mentoringAssessment: { findMany: jest.fn() },
    referenceFeedback: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommitteeDataService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CommitteeDataService>(CommitteeDataService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCollaboratorEvaluationData', () => {
    const collaborator = { id: 'user-1', name: 'Colaborador', jobTitle: 'Dev', seniority: 'JUNIOR' };
    const cycle = '2024-Q2';

    it('deve lançar NotFoundException se colaborador não existir', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getCollaboratorEvaluationData('user-1', cycle)).rejects.toThrow(NotFoundException);
    });

    it('deve retornar dados completos de avaliações', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(collaborator);
      mockPrisma.selfAssessment.findFirst.mockResolvedValue({
        answers: [
          { criterionId: 'sentimento-de-dono', score: 4, justification: 'Ótimo' },
          { criterionId: 'entregar-qualidade', score: 5, justification: 'Excelente' },
        ],
      });
      mockPrisma.assessment360.findMany.mockResolvedValue([
        { author: { name: 'Avaliador 360', jobTitle: 'Analista' }, overallScore: 4.5, strengths: 'Bom trabalho', improvements: 'Atenção a prazos' },
      ]);
      mockPrisma.managerAssessment.findMany.mockResolvedValue([
        {
          author: { name: 'Gestor', jobTitle: 'Manager' },
          answers: [
            { criterionId: 'gestao-gente', score: 3, justification: 'Precisa melhorar' },
          ],
        },
      ]);
      mockPrisma.mentoringAssessment.findMany.mockResolvedValue([
        { author: { name: 'Mentor' }, score: 5, justification: 'Ótimo mentorado' },
      ]);
      mockPrisma.referenceFeedback.findMany.mockResolvedValue([
        { author: { name: 'Colega' }, justification: 'Trabalha bem em equipe' },
      ]);

      const result = await service.getCollaboratorEvaluationData('user-1', cycle);

      expect(result.collaboratorId).toBe('user-1');
      expect(result.selfAssessment).toBeDefined();
      expect(result.assessments360.length).toBe(1);
      expect(result.managerAssessments.length).toBe(1);
      expect(result.mentoringAssessments.length).toBe(1);
      expect(result.referenceFeedbacks.length).toBe(1);
      expect(result.statistics).toBeDefined();
      expect(result.statistics.averageScore).toBeGreaterThan(0);
      expect(result.statistics.totalEvaluations).toBeGreaterThan(0);
      expect(result.statistics.scoresByPillar).toHaveProperty('comportamento');
      expect(result.statistics.scoresByPillar).toHaveProperty('execucao');
      expect(result.statistics.scoresByPillar).toHaveProperty('gestao');
    });

    it('deve lidar com avaliações vazias', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(collaborator);
      mockPrisma.selfAssessment.findFirst.mockResolvedValue(null);
      mockPrisma.assessment360.findMany.mockResolvedValue([]);
      mockPrisma.managerAssessment.findMany.mockResolvedValue([]);
      mockPrisma.mentoringAssessment.findMany.mockResolvedValue([]);
      mockPrisma.referenceFeedback.findMany.mockResolvedValue([]);

      const result = await service.getCollaboratorEvaluationData('user-1', cycle);
      expect(result.selfAssessment).toBeNull();
      expect(result.assessments360).toEqual([]);
      expect(result.managerAssessments).toEqual([]);
      expect(result.mentoringAssessments).toEqual([]);
      expect(result.referenceFeedbacks).toEqual([]);
      expect(result.statistics.averageScore).toBe(0);
      expect(result.statistics.totalEvaluations).toBe(0);
    });

    it('deve lidar com critério desconhecido', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(collaborator);
      mockPrisma.selfAssessment.findFirst.mockResolvedValue({
        answers: [
          { criterionId: 'criterio-desconhecido', score: 2, justification: 'Desconhecido' },
        ],
      });
      mockPrisma.assessment360.findMany.mockResolvedValue([]);
      mockPrisma.managerAssessment.findMany.mockResolvedValue([]);
      mockPrisma.mentoringAssessment.findMany.mockResolvedValue([]);
      mockPrisma.referenceFeedback.findMany.mockResolvedValue([]);

      const result = await service.getCollaboratorEvaluationData('user-1', cycle);
      expect(result.selfAssessment).not.toBeNull();
      if (result.selfAssessment) {
        expect(result.selfAssessment.answers[0].criterionName).toBe('criterio-desconhecido');
        expect(result.selfAssessment.answers[0].pillarName).toBe('Desconhecido');
      }
    });
  });

  describe('Métodos privados', () => {
    it('calculateAverageScore deve retornar média correta', () => {
      const scores = [4, 5, 3];
      const result = (service as any).calculateAverageScore(scores);
      expect(result).toBeCloseTo(4);
    });
    it('calculateAverageScore deve retornar 0 para array vazio', () => {
      const result = (service as any).calculateAverageScore([]);
      expect(result).toBe(0);
    });
    it('mapPillarName deve mapear corretamente', () => {
      expect((service as any).mapPillarName('Comportamento')).toBe('comportamento');
      expect((service as any).mapPillarName('Execução')).toBe('execucao');
      expect((service as any).mapPillarName('Gestão')).toBe('gestao');
      expect((service as any).mapPillarName('Outro')).toBeNull();
    });
    it('getCriterionInfo deve retornar nome e pilar corretos', () => {
      expect((service as any).getCriterionInfo('sentimento-de-dono')).toEqual({ name: 'Sentimento de Dono', pillar: 'Comportamento' });
      expect((service as any).getCriterionInfo('criterio-desconhecido')).toEqual({ name: 'criterio-desconhecido', pillar: 'Desconhecido' });
    });
    it('calculateScoresByPillar deve calcular médias por pilar', () => {
      const selfAssessment = { answers: [ { pillarName: 'Comportamento', score: 4 }, { pillarName: 'Execução', score: 5 } ] };
      const managerAssessments = [ { answers: [ { pillarName: 'Gestão', score: 3 } ] } ];
      const result = (service as any).calculateScoresByPillar(selfAssessment, managerAssessments);
      expect(result.comportamento).toBe(4);
      expect(result.execucao).toBe(5);
      expect(result.gestao).toBe(3);
    });
  });
}); 