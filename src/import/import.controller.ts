// src/import/import.controller.ts
import { Controller, Post, UseGuards, UploadedFiles, UseInterceptors, HttpStatus, Res, Body } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { HRRoleGuard } from '../auth/guards/hr-role.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ImportService } from './import.service';
import { Response } from 'express';
import { ApiConsumes, ApiBody, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';


@ApiBearerAuth()
@Controller('api/import') // <-- A ÚNICA ALTERAÇÃO NECESSÁRIA É AQUI
@UseGuards(JwtAuthGuard, HRRoleGuard)
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('historical-data')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Arquivos CSV ou XLSX de histórico para importação',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Importa dados históricos de arquivos (Apenas RH)' })
  async importHistoricalData(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Res() res: Response
  ) {
    if (!files || files.length === 0) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Nenhum arquivo enviado.' });
    }

    try {
      // O processamento agora pode ser mais simples, delegando ao serviço
      const results = await this.importService.processCsvFile(files[0].originalname, files[0].buffer);
      return res.status(HttpStatus.OK).json(results);
    } catch (error: any) {
      console.error(`Erro no controller ao processar o arquivo:`, error.message);
      return res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Erro interno ao processar o arquivo.',
      });
    }
  }
}