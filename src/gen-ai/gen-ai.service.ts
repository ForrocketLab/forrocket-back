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
    Array.isArray((obj as BrutalFactsDto).facts)
  );
}

@Injectable()
export class GenAiService {
  private readonly logger = new Logger(GenAiService.name);

  constructor(private readonly httpService: HttpService) {}

  /**
   * Gera "brutal facts" a partir de um texto de avaliação usando uma LLM.
   * @param evaluationText O texto completo da avaliação.
   * @returns Uma promessa que resolve para um array de strings com os fatos.
   */
  async getBrutalFacts(evaluationText: string): Promise<string[]> {
    const prompt = `
    Você é um agente especializado em extrair fatos diretos e honestos de avaliações de desempenho do sistema RPE.
      Baseado no seguinte texto de uma avaliação de desempenho, extraia 3 "brutal facts" (fatos diretos e honestos) sobre os pontos a melhorar.
      Retorne os fatos em um array de strings JSON. Não adicione nenhum texto antes ou depois do array.
      A resposta DEVE ser apenas o array JSON.

      Texto da avaliação: "${evaluationText}"

      JSON_RESPONSE:
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
          'O JSON retornado pela LLM não tem o formato esperado { "facts": [...] }',
          parsedJson,
        );
        throw new InternalServerErrorException('Formato de dados inesperado da API de IA.');
      }

      return parsedJson.facts || [];
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
