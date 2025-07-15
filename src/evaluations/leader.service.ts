import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

// DTO para os detalhes do projeto que serão retornados pela API
export interface ProjectDetailsDto {
  projectName: string;
  scores: {
    cycle: string;
    score: number;
    reason: string;
  }[];
  percentage: number;
  EndDate: string;
  CollaboratorsNumber: number;
}

// DTO para o objeto que contém todos os projetos
export interface AllProjectsDataDto {
  [projectKey: string]: ProjectDetailsDto;
}


@Injectable()
export class LeaderService {
  private readonly logger = new Logger('LeaderService');

  // --- MÉTODO EXISTENTE (permanece igual) ---
  async getProjectDashboardDetails(projectId: string): Promise<ProjectDetailsDto> {
    // ... seu código existente para buscar um projeto ...
    const dataPath = path.join(process.cwd(), 'src', 'data', 'evaluations.json');
    try {
      const fileContent = fs.readFileSync(dataPath, 'utf-8');
      const allData = JSON.parse(fileContent);
      const projectsObject = allData.projetos[0];
      const projectData = projectsObject?.[projectId];
      if (!projectData) {
        throw new NotFoundException(`Detalhes para o projeto com ID '${projectId}' não encontrados.`);
      }
      const response: ProjectDetailsDto = {
        projectName: projectId.replace(/projeto-|-/g, ' ').trim().replace(/\b\w/g, l => l.toUpperCase()),
        scores: projectData.scores.map((s: any) => ({ ...s, reason: s.reason || '' })),
        percentage: projectData.percentage,
        EndDate: projectData.EndDate,
        CollaboratorsNumber: projectData.CollaboratorsNumber,
      };
      return response;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Erro ao ler ou analisar o arquivo evaluations.json', error.stack);
      throw new Error('Não foi possível carregar os dados do projeto.');
    }
  }

  // --- NOVO MÉTODO ADICIONADO ---
  /**
   * Busca os dados de todos os projetos para popular o seletor.
   */
  async getAllProjectsForSelector(): Promise<AllProjectsDataDto> {
    const dataPath = path.join(process.cwd(), 'src', 'data', 'evaluations.json');
    try {
      const fileContent = fs.readFileSync(dataPath, 'utf-8');
      const allData = JSON.parse(fileContent);
      // Retorna o objeto completo que contém todos os projetos
      return allData.projetos[0];
    } catch (error) {
      this.logger.error('Erro ao ler ou analisar o arquivo evaluations.json para o seletor', error.stack);
      throw new Error('Não foi possível carregar os dados de todos os projetos.');
    }
  }
  
  async getProjectBurndownData(projectId: string): Promise<any[]> {
    const dataPath = path.join(process.cwd(), 'src', 'data', 'burndown-data.json');
    try {
      const fileContent = fs.readFileSync(dataPath, 'utf-8');
      const allBurndownData = JSON.parse(fileContent);

      // Retorna os dados para o projeto específico ou um array vazio se não encontrar
      return allBurndownData[projectId] || [];
    } catch (error) {
      this.logger.error(`Erro ao buscar dados de burndown para o projeto ${projectId}`, error.stack);
      // Retorna um array vazio em caso de erro para não quebrar o frontend
      return [];
    }
  }

}