import { Module } from '@nestjs/common';
import { EncryptionService } from './services/encryption.service';
import { EvaluationDecryptionInterceptor } from './interceptors/evaluation-decryption.interceptor';

@Module({
  providers: [EncryptionService, EvaluationDecryptionInterceptor],
  exports: [EncryptionService, EvaluationDecryptionInterceptor],
})
export class CommonModule {} 