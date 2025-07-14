import { Test, TestingModule } from '@nestjs/testing';

import { MentorService } from './mentor.service';

describe('MentorService', () => {
  let service: MentorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MentorService],
    }).compile();

    service = module.get<MentorService>(MentorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
