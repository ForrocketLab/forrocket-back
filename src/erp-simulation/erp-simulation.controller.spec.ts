import { Test, TestingModule } from '@nestjs/testing';
import { ErpSimulationController } from './erp-simulation.controller';
import { ErpSimulationService } from './erp-simulation.service';

describe('ErpSimulationController', () => {
  let controller: ErpSimulationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ErpSimulationController],
      providers: [
        {
          provide: ErpSimulationService,
          useValue: {
            getManagerDashboard: jest.fn(),
            getSelfAssessment: jest.fn(),
            submitManagerAssessment: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ErpSimulationController>(ErpSimulationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});