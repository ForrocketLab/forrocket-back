
import { Test, TestingModule } from '@nestjs/testing';
import { ErpSimulationController } from './erp-simulation.controller';

describe('ErpSimulationController', () => {
  let controller: ErpSimulationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ErpSimulationController],
    }).compile();

    controller = module.get<ErpSimulationController>(ErpSimulationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});