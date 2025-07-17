import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { EncryptionService } from '../services/encryption.service';

/**
 * Interceptor que processa dados de entrada, criptografando scores e justificativas
 * antes de salvar no banco de dados
 */
@Injectable()
export class EvaluationInputInterceptor implements NestInterceptor {
  constructor(private readonly encryptionService: EncryptionService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    if (request.body) {
      // Processar o body da requisição
      request.body = this.processInputData(request.body);
    }

    return next.handle();
  }

  private processInputData(data: any): any {
    if (!data || typeof data !== 'object') return data;

    // Se é um array, processar cada item
    if (Array.isArray(data)) {
      return data.map(item => this.processInputData(item));
    }

    let result = { ...data };

    // Criptografar apenas campos de texto (justificativas, etc.)
    result = this.encryptTextFields(result);

    // Processar objetos aninhados
    for (const key in result) {
      if (typeof result[key] === 'object' && result[key] !== null) {
        result[key] = this.processInputData(result[key]);
      }
    }

    return result;
  }

  private encryptTextFields(data: any): any {
    if (!data || typeof data !== 'object') return data;

    const result = { ...data };
    
    // Campos de texto que devem ser criptografados
    const textFieldsToEncrypt = [
      'justification',
      'strengths',
      'improvements', 
      'observations',
      'summary',
      'insights',
      'scoreAnalysisSummary',
      'feedbackAnalysisSummary',
      'description',
      'topic'
    ];

    for (const field of textFieldsToEncrypt) {
      if (result[field] && typeof result[field] === 'string') {
        // Só criptografar se não estiver já criptografado
        if (!result[field].includes(':')) {
          const encrypted = this.encryptionService.encrypt(result[field]);
          result[field] = encrypted;
        }
      }
    }

    return result;
  }
} 