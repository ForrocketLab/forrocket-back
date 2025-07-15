import { Test, TestingModule } from '@nestjs/testing';
import { EvaluationsService } from '../evaluations.service';
import { PrismaService } from '../../database/prisma.service';
import { ProjectsService } from '../../projects/projects.service';
import { CyclesService } from '../cycles/cycles.service';
import { GenAiService } from '../../gen-ai/gen-ai.service';
import { EncryptionService } from '../../common/services/encryption.service';
import { WorkAgainMotivation } from '@prisma/client';

describe('EvaluationsService - getProjectCollaborators360', () => {
  let service: EvaluationsService;
  let prismaService: PrismaService;
  let projectsService: ProjectsService;
  let cyclesService: CyclesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvaluationsService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findMany: jest.fn(),
            },
            assessment360: {
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: ProjectsService,
          useValue: {
            canEvaluateUserIn360: jest.fn(),
          },
        },
        {
          provide: CyclesService,
          useValue: {
            validateActiveCyclePhase: jest.fn(),
          },
        },
        {
          provide: GenAiService,
          useValue: {},
        },
        {
          provide: EncryptionService,
          useValue: {
            decrypt: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EvaluationsService>(EvaluationsService);
    prismaService = module.get<PrismaService>(PrismaService);
    projectsService = module.get<ProjectsService>(ProjectsService);
    cyclesService = module.get<CyclesService>(CyclesService);
  });

  it('should return project collaborators with 360 assessments', async () => {
    // Mock cycle validation
    jest.spyOn(cyclesService, 'validateActiveCyclePhase').mockResolvedValue({
      name: '2025.1',
      status: 'ACTIVE',
      phase: 'ASSESSMENTS',
    } as any);

    // Mock users
    const mockUsers = [
      {
        id: 'user2',
        name: 'João Silva',
        jobTitle: 'Desenvolvedor Senior',
        isActive: true,
      },
      {
        id: 'user3',
        name: 'Maria Santos',
        jobTitle: 'Desenvolvedora Frontend',
        isActive: true,
      },
    ];

    jest.spyOn(prismaService.user, 'findMany').mockResolvedValue(mockUsers);

    // Mock canEvaluateUserIn360
    jest.spyOn(projectsService, 'canEvaluateUserIn360').mockResolvedValue(true);

    // Mock existing assessments
    const mockAssessments = [
      {
        id: 'assessment1',
        authorId: 'user1',
        evaluatedUserId: 'user2',
        cycle: '2025.1',
        overallScore: 4,
        strengths: 'encrypted_strengths',
        improvements: 'encrypted_improvements',
        motivationToWorkAgain: WorkAgainMotivation.STRONGLY_AGREE,
      },
    ];

    jest.spyOn(prismaService.assessment360, 'findMany').mockResolvedValue(mockAssessments);

    // Mock encryption service
    jest
      .spyOn(service['encryptionService'], 'decrypt')
      .mockReturnValueOnce('Excellent communication')
      .mockReturnValueOnce('Could improve time management');

    const result = await service.getProjectCollaborators360('user1');

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: 'user2',
      name: 'João Silva',
      role: 'Desenvolvedor Senior',
      initials: 'JS',
      rating: 4,
      strengths: 'Excellent communication',
      improvements: 'Could improve time management',
      workAgainMotivation: WorkAgainMotivation.STRONGLY_AGREE,
    });
    expect(result[1]).toEqual({
      id: 'user3',
      name: 'Maria Santos',
      role: 'Desenvolvedora Frontend',
      initials: 'MS',
      rating: 0,
      strengths: '',
      improvements: '',
      workAgainMotivation: 'NEUTRAL',
    });
  });

  it('should return empty array when no collaborators found', async () => {
    jest.spyOn(cyclesService, 'validateActiveCyclePhase').mockResolvedValue({
      name: '2025.1',
      status: 'ACTIVE',
      phase: 'ASSESSMENTS',
    } as any);

    jest.spyOn(prismaService.user, 'findMany').mockResolvedValue([]);

    const result = await service.getProjectCollaborators360('user1');

    expect(result).toEqual([]);
  });

  it('should return empty array when cycle validation fails', async () => {
    jest
      .spyOn(cyclesService, 'validateActiveCyclePhase')
      .mockRejectedValue(new Error('No active cycle'));

    const result = await service.getProjectCollaborators360('user1');

    expect(result).toEqual([]);
  });
});
