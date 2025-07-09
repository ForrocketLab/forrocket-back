import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

// Carregar variáveis de ambiente
config();

class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly secretKey: string;

  constructor() {
    this.secretKey = process.env.ENCRYPTION_KEY || '';
    
    if (this.secretKey.length !== 32) {
      throw new Error('Encryption key must be exactly 32 characters long');
    }
  }

  encrypt(text: string): string {
    if (!text) return text;

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);
    cipher.setAAD(Buffer.from('forrocket-evaluation-data'));

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }
}

async function main() {
  const prisma = new PrismaClient();
  const encryptionService = new EncryptionService();

  console.log('🔐 Iniciando criptografia dos dados existentes...\n');

  try {
    // 1. Criptografar justificativas de autoavaliações
    const selfAssessmentAnswers = await prisma.selfAssessmentAnswer.findMany({
      where: {
        justification: {
          not: {
            contains: ':'
          }
        }
      }
    });

    console.log(`📝 Encontradas ${selfAssessmentAnswers.length} respostas de autoavaliação para criptografar`);
    
    for (const answer of selfAssessmentAnswers) {
      await prisma.selfAssessmentAnswer.update({
        where: { id: answer.id },
        data: {
          justification: encryptionService.encrypt(answer.justification)
        }
      });
    }

    // 2. Criptografar dados de avaliações 360
    const assessments360 = await prisma.assessment360.findMany({
      where: {
        OR: [
          { strengths: { not: { contains: ':' } } },
          { improvements: { not: { contains: ':' } } }
        ]
      }
    });

    console.log(`🌐 Encontradas ${assessments360.length} avaliações 360 para criptografar`);
    
    for (const assessment of assessments360) {
      await prisma.assessment360.update({
        where: { id: assessment.id },
        data: {
          strengths: encryptionService.encrypt(assessment.strengths),
          improvements: encryptionService.encrypt(assessment.improvements)
        }
      });
    }

    // 3. Criptografar avaliações de mentoring
    const mentoringAssessments = await prisma.mentoringAssessment.findMany({
      where: {
        justification: {
          not: {
            contains: ':'
          }
        }
      }
    });

    console.log(`👨‍🏫 Encontradas ${mentoringAssessments.length} avaliações de mentoring para criptografar`);
    
    for (const assessment of mentoringAssessments) {
      await prisma.mentoringAssessment.update({
        where: { id: assessment.id },
        data: {
          justification: encryptionService.encrypt(assessment.justification)
        }
      });
    }

    // 4. Criptografar feedbacks de referência
    const referenceFeedbacks = await prisma.referenceFeedback.findMany({
      where: {
        OR: [
          { justification: { not: { contains: ':' } } },
          { topic: { not: { contains: ':' } } }
        ]
      }
    });

    console.log(`📞 Encontrados ${referenceFeedbacks.length} feedbacks de referência para criptografar`);
    
    for (const feedback of referenceFeedbacks) {
      const updateData: any = {};
      
      if (feedback.justification && !feedback.justification.includes(':')) {
        updateData.justification = encryptionService.encrypt(feedback.justification);
      }
      
      if (feedback.topic && !feedback.topic.includes(':')) {
        updateData.topic = encryptionService.encrypt(feedback.topic);
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.referenceFeedback.update({
          where: { id: feedback.id },
          data: updateData
        });
      }
    }

    // 5. Criptografar avaliações de gestor
    const managerAssessmentAnswers = await prisma.managerAssessmentAnswer.findMany({
      where: {
        justification: {
          not: {
            contains: ':'
          }
        }
      }
    });

    console.log(`👔 Encontradas ${managerAssessmentAnswers.length} respostas de avaliação de gestor para criptografar`);
    
    for (const answer of managerAssessmentAnswers) {
      await prisma.managerAssessmentAnswer.update({
        where: { id: answer.id },
        data: {
          justification: encryptionService.encrypt(answer.justification)
        }
      });
    }

    // 6. Criptografar avaliações de comitê
    const committeeAssessments = await prisma.committeeAssessment.findMany({
      where: {
        OR: [
          { justification: { not: { contains: ':' } } },
          { observations: { not: { contains: ':' } } }
        ]
      }
    });

    console.log(`🏛️ Encontradas ${committeeAssessments.length} avaliações de comitê para criptografar`);
    
    for (const assessment of committeeAssessments) {
      const updateData: any = {};
      
      if (assessment.justification && !assessment.justification.includes(':')) {
        updateData.justification = encryptionService.encrypt(assessment.justification);
      }
      
      if (assessment.observations && !assessment.observations.includes(':')) {
        updateData.observations = encryptionService.encrypt(assessment.observations);
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.committeeAssessment.update({
          where: { id: assessment.id },
          data: updateData
        });
      }
    }

    console.log('\n✅ Criptografia dos dados existentes concluída com sucesso!');
    console.log('🔒 Todos os textos sensíveis agora estão criptografados no banco de dados.');
    console.log('📊 Os scores permanecem como números para manter compatibilidade.');

  } catch (error) {
    console.error('❌ Erro durante a criptografia:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 