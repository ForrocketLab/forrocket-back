import { Module } from '@nestjs/common';
import { LeaderController } from './leader.controller';
import { LeaderService } from './leader.service';

@Module({
  imports: [], // Adicione aqui outros módulos se o LeaderService precisar (ex: DatabaseModule)
  controllers: [LeaderController],
  providers: [LeaderService],
})
export class LeaderModule {}