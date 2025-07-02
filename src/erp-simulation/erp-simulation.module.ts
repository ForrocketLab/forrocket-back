import { Module } from '@nestjs/common';
import { ErpSimulationController } from './erp-simulation.controller';
import { ErpSimulationService } from './erp-simulation.service';

@Module({
  controllers: [ErpSimulationController],
  providers: [ErpSimulationService]
})
export class ErpSimulationModule {}
