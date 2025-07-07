import { Test, TestingModule } from '@nestjs/testing';
import { ErpSimulationService } from './erp-simulation.service';
import * as fs from 'fs';
import * as path from 'path';

describe('ErpSimulationService', () => {
  let service: ErpSimulationService;

  const mockErpData = {
    colaboradores: [
      { id: '1', Name: 'João Silva', JobTitle: 'Dev', Manager: 'bruno.id', 'E-mail': 'joao@rocketcorp.com' },
      { id: '2', Name: 'Maria Santos', JobTitle: 'QA', Manager: 'bruno.id', 'E-mail': 'maria@rocketcorp.com' },
      { id: '3', Name: 'Carlos Souza', JobTitle: 'PO', Manager: 'outro.id', 'E-mail': 'carlos@rocketcorp.com' },
    ],
  };
  const mockEvaluationsData = {
    avaliacoes: [
      { id_avaliacao: 'eval-1', id_avaliado: '1', id_avaliador: '2', tipo_avaliacao: 'Autoavaliação', answers: [ { criterionId: 'c1', score: 4, justification: 'Bom' } ] },
      { id_avaliacao: 'eval-2', id_avaliado: '2', id_avaliador: '2', tipo_avaliacao: 'Autoavaliação', answers: [ { criterionId: 'c2', score: 5, justification: 'Ótimo' } ] },
      { id_avaliacao: 'eval-3', id_avaliado: '1', id_avaliador: '2', tipo_avaliacao: 'Gestor', answers: [] },
    ],
  };

  beforeEach(async () => {
    // Mock console.log e console.error
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock fs.readFileSync para lidar com os caminhos específicos
    jest.spyOn(fs, 'readFileSync').mockImplementation((filePath: any) => {
      const pathStr = filePath.toString();
      if (pathStr.includes('ERP.json')) {
        return JSON.stringify(mockErpData);
      }
      if (pathStr.includes('evaluations.json')) {
        return JSON.stringify(mockEvaluationsData);
      }
      return '';
    });
    
    jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [ErpSimulationService],
    }).compile();

    service = module.get<ErpSimulationService>(ErpSimulationService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getManagerDashboard', () => {
    it('deve retornar dashboard com liderados do gestor', () => {
      const result = service.getManagerDashboard('2024-Q1', 'bruno.id');
      expect(result.collaboratorsInfo[0].subordinates.length).toBe(2);
      expect(result.collaboratorsInfo[0].subordinates[0]).toHaveProperty('status');
    });
    
    it('deve lançar BadRequestException se managerUserId não for informado', () => {
      expect(() => service.getManagerDashboard('2024-Q1', '')).toThrow();
    });
  });

  describe('getSelfAssessment', () => {
    it('deve retornar autoavaliação formatada', () => {
      const result = service.getSelfAssessment('1');
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('status', 'DONE');
      expect(result.answers[0]).toHaveProperty('criterionId', 'c1');
    });
    
    it('deve lançar NotFoundException se não encontrar autoavaliação', () => {
      expect(() => service.getSelfAssessment('999')).toThrow();
    });
  });

  describe('submitManagerAssessment', () => {
    it('deve salvar avaliação do gestor e retornar mensagem de sucesso', () => {
      const payload = { evaluatedUserId: '1', c1Score: 5, c1Justification: 'Ótimo trabalho' };
      const managerId = 'bruno.id';
      const result = service.submitManagerAssessment(payload, managerId);
      expect(result).toHaveProperty('message');
      expect(result.data).toHaveProperty('id_avaliado', '1');
      expect(result.data).toHaveProperty('id_avaliador', managerId);
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
    
    it('deve lançar erro se ocorrer problema ao salvar avaliação', () => {
      jest.spyOn(fs, 'readFileSync').mockImplementationOnce(() => { 
        throw new Error('FS error'); 
      });
      expect(() => service.submitManagerAssessment({ evaluatedUserId: '1' }, 'bruno.id')).toThrow();
    });
  });

  describe('login', () => {
    it('deve retornar usuário ao encontrar email', () => {
      const result = service.login('joao@rocketcorp.com');
      expect(result).toHaveProperty('id', '1');
    });
    
    it('deve lançar NotFoundException se email não existir', () => {
      expect(() => service.login('naoexiste@rocketcorp.com')).toThrow();
    });
  });
});