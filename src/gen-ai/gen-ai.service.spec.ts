import { Test, TestingModule } from '@nestjs/testing';

import { GenAiService } from './gen-ai.service';

describe('GenAiService', () => {
  let service: GenAiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GenAiService],
    }).compile();

    service = module.get<GenAiService>(GenAiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
