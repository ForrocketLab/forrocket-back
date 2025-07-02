import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';

import { GenAiService } from './gen-ai.service';

describe('GenAiService', () => {
  let service: GenAiService;

  beforeEach(async () => {
    const mockHttpService = {
      post: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenAiService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<GenAiService>(GenAiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
