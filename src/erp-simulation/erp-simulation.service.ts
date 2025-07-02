// src/erp-simulation/erp-simulation.service.tsAdd commentMore actions

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

// Define os caminhos para os nossos ficheiros JSON dentro da pasta 'src'
const erpPath = path.join(process.cwd(), 'src', 'data', 'ERP.json');
const evaluationsPath = path.join(process.cwd(), 'src', 'data', 'evaluations.json');

@Injectable()
export class ErpSimulationService {
  // Carrega os dados dos colaboradores uma vez, pois eles são apenas para leitura
  private readonly erpData = JSON.parse(fs.readFileSync(erpPath, 'utf-8'));

  /**
   * Lógica para o endpoint do dashboard do gestor.
   * Lista os liderados e o status de suas avaliações.
   */
  getManagerDashboard(cycle: string, managerUserId: string) {
    if (!managerUserId) {
      throw new BadRequestException('O ID do gestor é obrigatório.');
    }
    
    const liderados = this.erpData.colaboradores.filter(c => c.Manager === 'bruno.id');
    const evaluationsData = JSON.parse(fs.readFileSync(evaluationsPath, 'utf-8'));
    
    const dashboardData = liderados.map(liderado => {
      const avaliacaoDoGestor = evaluationsData.avaliacoes.find(
        aval => aval.id_avaliado === liderado.id && aval.id_avaliador === "2",
      );
      return {
        id: liderado.id, name: liderado.Name, jobTitle: liderado.JobTitle,
        avatarInitials: liderado.Name.split(' ').map(n => n[0]).join('').slice(0, 2),
        status: avaliacaoDoGestor ? 'CONCLUDED' : 'PENDING',
      };
    });

    return { collaboratorsInfo: [{ managerName: 'Bruno André Mendes Carvalho', subordinates: dashboardData }] };
  }

  /**
   * Busca e formata a autoavaliação de um colaborador específico para o frontend.
   */
  getSelfAssessment(subordinateId: string) {
    const evaluationsData = JSON.parse(fs.readFileSync(evaluationsPath, 'utf-8'));
    
    const rawSelfAssessment = evaluationsData.avaliacoes.find(
      (aval: any) => aval.id_avaliado === subordinateId && aval.tipo_avaliacao === 'Autoavaliação',
    );

    if (!rawSelfAssessment) {
      throw new NotFoundException(`Autoavaliação para o colaborador com ID ${subordinateId} não encontrada.`);
    }

    const formattedResponse = {
      id: rawSelfAssessment.id_avaliacao,
      status: 'DONE',
      answers: rawSelfAssessment.answers.map((ans: any, index: number) => ({
        id: `answer-${ans.criterionId}-${index}`,
        selfAssessmentId: rawSelfAssessment.id_avaliacao,
        criterionId: ans.criterionId,
        score: ans.score,
        justification: ans.justification,
      })),
    };

    return formattedResponse;
  }

  /**
   * Recebe e salva a avaliação feita por um gestor, incluindo notas e justificativas individuais.
   */
  submitManagerAssessment(payload: any, managerId: string) {
    // --- INÍCIO DA DEPURAÇÃO ---
    console.log('--- AVALIAÇÃO RECEBIDA NO BACKEND ---');
    console.log('Payload recebido do frontend:', payload);
    // --- FIM DA DEPURAÇÃO ---

    try {
      const evaluationsData = JSON.parse(fs.readFileSync(evaluationsPath, 'utf-8'));
      
      const notas: Record<string, number> = {};
      const justificativas: Record<string, string> = {};

      for (const key in payload) {
        if (key.endsWith('Score')) {
          const criterionId = key.replace('Score', '');
          notas[criterionId] = payload[key];
        } else if (key.endsWith('Justification')) {
          const criterionId = key.replace('Justification', '');
          justificativas[criterionId] = payload[key];
        }
      }

      const novaAvaliacao = {
        id_avaliacao: `eval_mgr_${Date.now()}`,
        id_avaliado: payload.evaluatedUserId,
        id_avaliador: managerId,
        tipo_avaliacao: "Gestor",
        notas,
        justificativas,
        data_avaliacao: new Date().toISOString()
      };

      // --- INÍCIO DA DEPURAÇÃO ---
      console.log('Objeto de avaliação a ser salvo:', novaAvaliacao);
      // --- FIM DA DEPURAÇÃO ---

      evaluationsData.avaliacoes.push(novaAvaliacao);
      fs.writeFileSync(evaluationsPath, JSON.stringify(evaluationsData, null, 2));
      
      console.log('SUCESSO: Ficheiro evaluations.json foi atualizado.');
      
      return { message: 'Avaliação do gestor recebida com sucesso!', data: novaAvaliacao };

    } catch (error) {
      // --- INÍCIO DA DEPURAÇÃO ---
      console.error('ERRO AO SALVAR A AVALIAÇÃO:', error);
      // --- FIM DA DEPURAÇÃO ---
      // Lança o erro para que o NestJS o devolva ao frontend como um erro 500
      throw error;
    }
  }

  /**
   * Lógica para o endpoint de login simulado.
   */
  login(email: string) {
    const usuarioEncontrado = this.erpData.colaboradores.find(
      c => c['E-mail'].toLowerCase() === email.toLowerCase(),
    );
    if (!usuarioEncontrado) {
      throw new NotFoundException('Utilizador não encontrado.');
    }
    return usuarioEncontrado;
  }
}