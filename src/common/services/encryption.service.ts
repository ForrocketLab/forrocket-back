import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly secretKey: string;

  constructor() {
    // Em produção, essa chave deve vir de variáveis de ambiente
    this.secretKey = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key-here!!';
    
    if (this.secretKey.length !== 32) {
      throw new Error('Encryption key must be exactly 32 characters long');
    }
  }

  /**
   * Criptografa um texto
   * @param text - Texto a ser criptografado
   * @returns Texto criptografado no formato: iv:authTag:encryptedData
   */
  encrypt(text: string): string {
    if (!text) return text;

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);
    cipher.setAAD(Buffer.from('forrocket-evaluation-data'));

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Formato: iv:authTag:encryptedData
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Descriptografa um texto
   * @param encryptedText - Texto criptografado no formato: iv:authTag:encryptedData
   * @returns Texto descriptografado
   */
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
      console.error('Error decrypting data:', error);
      return encryptedText; // Retorna o valor original se não conseguir descriptografar
    }
  }

  /**
   * Criptografa um número convertendo para string
   * @param num - Número a ser criptografado
   * @returns Número criptografado como string
   */
  encryptNumber(num: number): string {
    if (num === null || num === undefined) return '';
    return this.encrypt(num.toString());
  }

  /**
   * Descriptografa uma string e converte de volta para número
   * @param encryptedText - Texto criptografado
   * @returns Número descriptografado
   */
  decryptToNumber(encryptedText: string): number {
    if (!encryptedText || typeof encryptedText !== 'string') return 0;
    const decrypted = this.decrypt(encryptedText);
    const num = parseInt(decrypted, 10);
    return isNaN(num) ? 0 : num;
  }

  /**
   * Processa scores antes de salvar no banco (mantém como números)
   * @param data - Dados com scores como números do frontend
   * @returns Dados com scores mantidos como números para o banco
   */
  prepareScoresForDatabase(data: any): any {
    if (!data) return data;

    const result = { ...data };
    // Não altera os scores - eles permanecem como números no banco
    return result;
  }

  /**
   * Processa scores depois de buscar do banco (mantém como números)
   * @param data - Dados com scores como números do banco
   * @returns Dados com scores mantidos como números para o frontend
   */
  prepareScoresForFrontend(data: any): any {
    if (!data) return data;

    const result = { ...data };
    // Não altera os scores - eles permanecem como números para o frontend
    return result;
  }

  /**
   * Criptografa um objeto, encriptando apenas os campos especificados
   * @param obj - Objeto a ser processado
   * @param fieldsToEncrypt - Lista de campos a serem criptografados
   * @returns Objeto com campos criptografados
   */
  encryptObjectFields(obj: any, fieldsToEncrypt: string[]): any {
    if (!obj) return obj;

    const result = { ...obj };
    
    for (const field of fieldsToEncrypt) {
      if (result[field] !== null && result[field] !== undefined) {
        if (typeof result[field] === 'string') {
          result[field] = this.encrypt(result[field]);
        } else if (typeof result[field] === 'number') {
          result[field] = this.encryptNumber(result[field]);
        }
      }
    }

    return result;
  }

  /**
   * Descriptografa um objeto, descriptografando apenas os campos especificados
   * @param obj - Objeto a ser processado
   * @param fieldsToDecrypt - Lista de campos a serem descriptografados
   * @returns Objeto com campos descriptografados
   */
  decryptObjectFields(obj: any, fieldsToDecrypt: string[]): any {
    if (!obj) return obj;

    const result = { ...obj };
    
    for (const field of fieldsToDecrypt) {
      if (result[field] !== null && result[field] !== undefined) {
        if (typeof result[field] === 'string') {
          // Se é uma string e contém ':', provavelmente é um número criptografado
          if (result[field].includes(':') && this.isNumericField(field)) {
            result[field] = this.decryptToNumber(result[field]);
          } else {
            result[field] = this.decrypt(result[field]);
          }
        }
      }
    }

    return result;
  }

  /**
   * Verifica se um campo deveria conter um número
   */
  private isNumericField(field: string): boolean {
    const numericFields = ['score', 'overallScore', 'finalScore'];
    return numericFields.includes(field);
  }

  /**
   * Processa uma lista de objetos, criptografando os campos especificados
   */
  encryptArray(array: any[], fieldsToEncrypt: string[]): any[] {
    if (!array || !Array.isArray(array)) return array;
    
    return array.map(item => this.encryptObjectFields(item, fieldsToEncrypt));
  }

  /**
   * Processa uma lista de objetos, descriptografando os campos especificados
   */
  decryptArray(array: any[], fieldsToDecrypt: string[]): any[] {
    if (!array || !Array.isArray(array)) return array;
    
    return array.map(item => this.decryptObjectFields(item, fieldsToDecrypt));
  }
} 