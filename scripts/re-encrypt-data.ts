import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

// Carregar variáveis de ambiente
config();

class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly secretKey: string;

  constructor(key?: string) {
    this.secretKey = key || process.env.ENCRYPTION_KEY || '';
    
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

  decrypt(encryptedText: string): string {
    if (!encryptedText || !encryptedText.includes(':')) return encryptedText;

    try {
      const parts = encryptedText.split(':');
      if (parts.length !== 3) return encryptedText;

      const [ivHex, authTagHex, encrypted] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      const decipher = crypto.createDecipheriv(this.algorithm, this.secretKey, iv);
      decipher.setAAD(Buffer.from('forrocket-evaluation-data'));
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error(`❌ Erro ao descriptografar com chave ${this.secretKey.substring(0, 8)}...`);
      return encryptedText;
    }
  }
}

async function main() {
  const prisma = new PrismaClient();
  
  // Chave atual
  const currentKey = process.env.ENCRYPTION_KEY || '';
  
  // Possíveis chaves antigas (adicione aqui se souber de outras chaves que foram usadas)
  const possibleOldKeys = [
    'your-32-character-secret-key-here', // Chave padrão do código (32 chars)
    'default-encryption-key-for-tests!!', // Outra possível chave (32 chars)
    'forrocket-default-encryption-key!', // Chave específica do projeto (32 chars)
    'test-encryption-key-for-dev-only!', // Chave de desenvolvimento (32 chars)
    '12345678901234567890123456789012',
    '7527ba39dcb7e57bf4b7a4549d3414d2', // Chave simples para testes (32 chars)
    // Adicione outras chaves que podem ter sido usadas
  ];

  const currentEncryption = new EncryptionService(currentKey);

  console.log('🔐 Iniciando re-criptografia dos dados existentes...\n');
  console.log(`📍 Chave atual: ${currentKey.substring(0, 8)}...`);

  try {
    // 1. Re-criptografar avaliações de comitê
    const committeeAssessments = await prisma.committeeAssessment.findMany({
      where: {
        justification: {
          contains: ':'
        }
      }
    });

    console.log(`🏛️ Encontradas ${committeeAssessments.length} avaliações de comitê para re-criptografar`);
    
    for (const assessment of committeeAssessments) {
      console.log(`\n🔄 Processando avaliação ${assessment.id}...`);
      console.log(`📝 Justificativa atual: ${assessment.justification}`);
      
      let decryptedJustification = assessment.justification;
      
      // Tentar descriptografar com chave atual primeiro
      const testDecryption = currentEncryption.decrypt(assessment.justification);
      if (testDecryption !== assessment.justification) {
        console.log(`✅ Descriptografia com chave atual funcionou`);
        decryptedJustification = testDecryption;
      } else {
        console.log(`⚠️ Chave atual não funcionou, tentando chaves antigas...`);
        
        // Tentar com chaves antigas
        for (const oldKey of possibleOldKeys) {
          try {
            console.log(`🔑 Tentando chave: ${oldKey.substring(0, 8)}... (${oldKey.length} chars)`);
            
            if (oldKey.length !== 32) {
              console.log(`⚠️ Chave tem tamanho incorreto (${oldKey.length} chars), pulando...`);
              continue;
            }
            
            const oldEncryption = new EncryptionService(oldKey);
            const testOldDecryption = oldEncryption.decrypt(assessment.justification);
            
            if (testOldDecryption !== assessment.justification) {
              console.log(`✅ Descriptografia com chave antiga funcionou!`);
              decryptedJustification = testOldDecryption;
              break;
            }
          } catch (error) {
            console.log(`❌ Erro ao tentar chave: ${error.message}`);
            continue;
          }
        }
      }
      
      if (decryptedJustification === assessment.justification) {
        console.log(`❌ Não foi possível descriptografar a justificativa`);
        continue;
      }
      
      // Re-criptografar com a chave atual
      const reEncryptedJustification = currentEncryption.encrypt(decryptedJustification);
      
      await prisma.committeeAssessment.update({
        where: { id: assessment.id },
        data: {
          justification: reEncryptedJustification
        }
      });
      
      console.log(`✅ Re-criptografado com sucesso`);
      console.log(`📝 Texto original: ${decryptedJustification}`);
      console.log(`🔒 Novo valor criptografado: ${reEncryptedJustification}`);
    }

    // 2. Re-criptografar observations se necessário
    const assessmentsWithObservations = await prisma.committeeAssessment.findMany({
      where: {
        observations: {
          contains: ':'
        }
      }
    });

    console.log(`🏛️ Encontradas ${assessmentsWithObservations.length} observações para re-criptografar`);
    
    for (const assessment of assessmentsWithObservations) {
      if (!assessment.observations) continue;
      
      console.log(`\n🔄 Processando observação ${assessment.id}...`);
      
      let decryptedObservations = assessment.observations;
      
      // Tentar descriptografar com chave atual primeiro
      const testDecryption = currentEncryption.decrypt(assessment.observations);
      if (testDecryption !== assessment.observations) {
        decryptedObservations = testDecryption;
      } else {
        // Tentar com chaves antigas
        for (const oldKey of possibleOldKeys) {
          try {
            if (oldKey.length !== 32) {
              continue;
            }
            
            const oldEncryption = new EncryptionService(oldKey);
            const testOldDecryption = oldEncryption.decrypt(assessment.observations);
            
            if (testOldDecryption !== assessment.observations) {
              decryptedObservations = testOldDecryption;
              break;
            }
          } catch (error) {
            continue;
          }
        }
      }
      
      if (decryptedObservations === assessment.observations) {
        console.log(`❌ Não foi possível descriptografar as observações`);
        continue;
      }
      
      // Re-criptografar com a chave atual
      const reEncryptedObservations = currentEncryption.encrypt(decryptedObservations);
      
      await prisma.committeeAssessment.update({
        where: { id: assessment.id },
        data: {
          observations: reEncryptedObservations
        }
      });
      
      console.log(`✅ Observações re-criptografadas com sucesso`);
    }

    console.log('\n✅ Re-criptografia concluída com sucesso!');
    console.log('🔒 Todos os dados agora estão criptografados com a chave atual.');

  } catch (error) {
    console.error('❌ Erro durante a re-criptografia:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 