import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';

import { BrutalFactsDto, OpenAiChatCompletionResponseDto } from './dto/gen-ai-response.dto';

function isBrutalFactsDto(obj: unknown): obj is BrutalFactsDto {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'facts' in obj &&
    typeof (obj as BrutalFactsDto).facts === 'string'
  );
}

@Injectable()
export class GenAiService {
  private readonly logger = new Logger(GenAiService.name);

  constructor(private readonly httpService: HttpService) {}

  /**
   * Gera "brutal facts" a partir de um texto de avaliação usando uma LLM.
   * @param evaluationText O texto completo da avaliação.
   * @returns Uma promessa que resolve para uma string com os fatos.
   */
  async getSummary(evaluationText: string): Promise<string> {
    const prompt = `
    Você é um agente especializado em extrair fatos diretos e honestos de avaliações de desempenho do sistema RPE.
      Baseado no seguinte texto de uma avaliação de desempenho, extraia varios "brutal facts" (fatos diretos e honestos) sobre os pontos a melhorar, em um único texto.
      Neste caso, você deve extrair dados baseados nas notas dos colaboradores, focando em insights que podem ser extraídos das notas e do texto da autoavaliação, além de avaliação em feedbacks360.
      Exemplo de output: Nenhum colaborador alcançou o status de alto desempenho (nota 4.5+). Isso indica ou uma evitação de inflação nas notas ou um problema fundamental na aquisição ou desenvolvimento de talentos.

      IMPORTANTE: Retorne EXATAMENTE no formato JSON abaixo, sem nenhum texto adicional:
      {
        "facts": "Texto aqui, lorem ipsum"
      }

      Texto da avaliação: "${evaluationText}"
    `;

    // Corpo da requisição para a API da OpenAI
    const payload = {
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4, // baixa temperatura para respostas mais diretas e menos criativas
      response_format: { type: 'json_object' },
    };

    try {
      this.logger.log('Enviando requisição para a LLM...');

      // faz a chamada POST para o endpoint de chat completions
      const response = await firstValueFrom(
        this.httpService.post<OpenAiChatCompletionResponseDto>('/chat/completions', payload),
      );

      this.logger.log('Resposta da LLM recebida com sucesso.');

      // extrai o conteúdo da resposta e faz o parse do JSON
      const responseContent = response.data.choices[0].message.content;

      if (!responseContent) {
        this.logger.error('A resposta da LLM não contém o conteúdo esperado.');
        throw new InternalServerErrorException('Resposta inválida da API de IA.');
      }

      const parsedJson: unknown = JSON.parse(responseContent);

      // usa função Type Guard para validar a estrutura
      if (!isBrutalFactsDto(parsedJson)) {
        this.logger.error(
          'O JSON retornado pela LLM não tem o formato esperado { "facts": "string" }',
          parsedJson,
        );
        throw new InternalServerErrorException('Formato de dados inesperado da API de IA.');
      }

      return parsedJson.facts || '';
    } catch (error) {
      if (error instanceof AxiosError) {
        this.logger.error('Erro na chamada para a API da LLM:', error.response?.data);
      } else {
        this.logger.error('Erro inesperado no LLMService:', error);
      }
      throw new InternalServerErrorException('Falha ao gerar fatos a partir da avaliação.');
    }
  }
}
