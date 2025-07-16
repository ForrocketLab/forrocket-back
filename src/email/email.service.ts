import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    // Configura o transportador de e-mail com base nas variáveis de ambiente
    // Usando porta 465 com SSL/TLS direto, que é mais robusto para Gmail.
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST'),
      port: 465, // Porta para SSL/TLS direto
      secure: true, // true para porta 465 (SSL/TLS direto)
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASSWORD'),
      },
    });

    // Verifica se o transportador está pronto para enviar e-mails
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('Erro ao verificar o transportador de e-mail:', error);
      } else {
        console.log('Servidor de e-mail pronto para enviar mensagens.');
      }
    });
  }

  /**
   * Envia um e-mail para o destinatário especificado.
   * @param to - Endereço de e-mail do destinatário.
   * @param subject - Assunto do e-mail.
   * @param text - Conteúdo do e-mail em texto puro.
   * @param html - Conteúdo do e-mail em HTML (opcional).
   */
  async sendMail(to: string, subject: string, text: string, html?: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('EMAIL_FROM'), 
        to,
        subject,
        text,
        html,
      });
      console.log(`✉️ E-mail enviado para: ${to}`);
    } catch (error) {
      console.error(`❌ Erro ao enviar e-mail para ${to}:`, error);
      throw new InternalServerErrorException('Erro ao enviar e-mail.');
    }
  }
}
