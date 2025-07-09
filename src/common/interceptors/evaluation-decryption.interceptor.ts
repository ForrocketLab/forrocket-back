import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EncryptionService } from '../services/encryption.service';

/**
 * Interceptor que descriptografa automaticamente campos sensíveis de avaliações
 * vindos do banco antes de enviar os dados para o frontend
 */
@Injectable()
export class EvaluationDecryptionInterceptor implements NestInterceptor {
  constructor(private readonly encryptionService: EncryptionService) {}

  // Campos que devem ser descriptografados para cada tipo de avaliação
  private readonly fieldsToDecrypt = {
    selfAssessment: ['justification'],
    selfAssessmentAnswer: ['justification'],
    assessment360: ['strengths', 'improvements'],
    mentoringAssessment: ['justification'],
    referenceFeedback: ['justification', 'topic'],
    managerAssessment: [],
    managerAssessmentAnswer: ['justification'],
    committeeAssessment: ['justification', 'observations'],
    genaiSummary: ['summary'],
    personalInsights: ['insights'],
    managerTeamSummary: ['scoreAnalysisSummary', 'feedbackAnalysisSummary'],
    pdi: ['description'],
    pdiAction: ['description'],
  };

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        if (!data) return data;

        // Se é um array, processar cada item
        if (Array.isArray(data)) {
          return data.map(item => this.decryptEvaluationData(item));
        }

        // Se é um objeto com propriedades que podem conter avaliações
        if (typeof data === 'object') {
          return this.decryptEvaluationData(data);
        }

        return data;
      }),
    );
  }

  private decryptEvaluationData(data: any): any {
    if (!data || typeof data !== 'object') return data;

    const result = { ...data };

    // Descriptografar apenas campos de texto baseado no tipo detectado
    for (const [type, fields] of Object.entries(this.fieldsToDecrypt)) {
      if (this.isOfType(result, type)) {
        for (const field of fields) {
          if (result[field] && typeof result[field] === 'string') {
            // Descriptografar campos de texto criptografados
            if (result[field].includes(':')) {
              result[field] = this.encryptionService.decrypt(result[field]);
            }
          }
        }
      }
    }

    // Processar arrays aninhados
    for (const key in result) {
      if (Array.isArray(result[key])) {
        result[key] = result[key].map((item: any) => this.decryptEvaluationData(item));
      } else if (typeof result[key] === 'object' && result[key] !== null) {
        result[key] = this.decryptEvaluationData(result[key]);
      }
    }

    return result;
  }

  private isOfType(obj: any, type: string): boolean {
    switch (type) {
      case 'selfAssessment':
        return obj.hasOwnProperty('authorId') && obj.hasOwnProperty('cycle') && obj.hasOwnProperty('answers');
      case 'selfAssessmentAnswer':
        return obj.hasOwnProperty('selfAssessmentId') && obj.hasOwnProperty('criterionId') && obj.hasOwnProperty('justification');
      case 'assessment360':
        return obj.hasOwnProperty('authorId') && obj.hasOwnProperty('evaluatedUserId') && obj.hasOwnProperty('strengths');
      case 'mentoringAssessment':
        return obj.hasOwnProperty('authorId') && obj.hasOwnProperty('mentorId') && obj.hasOwnProperty('score');
      case 'referenceFeedback':
        return obj.hasOwnProperty('authorId') && obj.hasOwnProperty('referencedUserId') && obj.hasOwnProperty('justification');
      case 'managerAssessmentAnswer':
        return obj.hasOwnProperty('managerAssessmentId') && obj.hasOwnProperty('criterionId') && obj.hasOwnProperty('justification');
      case 'committeeAssessment':
        return obj.hasOwnProperty('authorId') && obj.hasOwnProperty('evaluatedUserId') && obj.hasOwnProperty('finalScore');
      case 'genaiSummary':
        return obj.hasOwnProperty('collaboratorId') && obj.hasOwnProperty('summary');
      case 'personalInsights':
        return obj.hasOwnProperty('collaboratorId') && obj.hasOwnProperty('insights');
      case 'managerTeamSummary':
        return obj.hasOwnProperty('managerId') && obj.hasOwnProperty('scoreAnalysisSummary');
      case 'pdi':
        return obj.hasOwnProperty('collaboratorId') && obj.hasOwnProperty('title') && obj.hasOwnProperty('description');
      case 'pdiAction':
        return obj.hasOwnProperty('pdiId') && obj.hasOwnProperty('title') && obj.hasOwnProperty('description');
      default:
        return false;
    }
  }
} 