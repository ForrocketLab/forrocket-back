import { Test, TestingModule } from '@nestjs/testing';
import { ErpSimulationService } from './erp-simulation.service';

describe('ErpSimulationService', () => {
  let service: ErpSimulationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ErpSimulationService],
    }).compile();

    service = module.get<ErpSimulationService>(ErpSimulationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});