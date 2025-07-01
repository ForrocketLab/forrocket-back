  // src/import/import.controller.ts
  import { Controller, Post, UseGuards, UploadedFiles, UseInterceptors, HttpStatus, Res, Body } from '@nestjs/common';
  import { FilesInterceptor } from '@nestjs/platform-express';
  import { HRRoleGuard } from '../auth/guards/hr-role.guard';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { ImportService } from './import.service';
  import { Response } from 'express';
  import * as csvParser from 'csv-parser';
  import { Readable } from 'stream';
  // Adicione ApiBearerAuth aqui
  import { ApiConsumes, ApiBody, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'; // NOVO: Importar ApiBearerAuth


  @ApiBearerAuth() // ADICIONADO AQUI: Indica que este controlador usa autenticação Bearer (JWT)
  @Controller('import')
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
            description: 'Arquivos CSV de histórico para importação',
          },
        },
      },
    })
    @ApiOperation({ summary: 'Importa dados históricos de arquivos CSV (Apenas RH)' })
    async importHistoricalData(
      @UploadedFiles() files: Array<Express.Multer.File>,
      @Res() res: Response
    ) {
      // ... logs do controller ...

      if (!files || files.length === 0) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Nenhum arquivo enviado.' });
      }

      const results: any[] = [];
      for (const file of files) {
        const fileName = file.originalname;
        let fileContent: string | Buffer;

        if (fileName.endsWith('.xlsx')) {
          fileContent = file.buffer;
        } else {
          fileContent = file.buffer.toString('utf8');
        }

        try {
          const importResult = await this.importService.processCsvFile(fileName, fileContent);
          results.push({ fileName, status: 'success', data: importResult });
        } catch (error) {
          console.error(`Erro ao processar o arquivo '${fileName}':`, error.message);
          results.push({ fileName, status: 'error', record: file.buffer.length > 0 ? (file.buffer as any).toString('utf8').substring(0, 100) : null, message: error.message } as any); // Simplificado record
        }
      }

      return res.status(HttpStatus.OK).json(results);
    }
  }