import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  UploadedFiles,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiConsumes,
  ApiBody,
  ApiOperation,
  ApiBearerAuth,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';
import { User } from '@prisma/client';

import { ImportService } from './import.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { HRRoleGuard } from '../auth/guards/hr-role.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiBearerAuth()
@ApiTags('Importação')
@Controller('api/import')
@UseGuards(JwtAuthGuard, HRRoleGuard)
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  // @Post('historical-data')
  // @UseInterceptors(FilesInterceptor('files', 10))
  // @ApiConsumes('multipart/form-data')
  // @ApiBody({
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       files: {
  //         type: 'array',
  //         items: {
  //           type: 'string',
  //           format: 'binary',
  //         },
  //         description: 'Arquivos XLS ou XLSX de histórico para importação',
  //       },
  //     },
  //   },
  // })
  // @ApiOperation({ summary: 'Importa dados históricos de arquivos (Apenas RH)' })
  // async importHistoricalData(
  //   @UploadedFiles() files: Array<Express.Multer.File>,
  //   @Res() res: Response,
  //   @CurrentUser() user: User,
  // ) {
  //   if (!files || files.length === 0) {
  //     return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Nenhum arquivo enviado.' });
  //   }

  //   try {
  //     const results = await this.importService.processExcelFile(
  //       files[0].originalname,
  //       files[0].buffer,
  //       user.email,
  //     );
  //     return res.status(HttpStatus.OK).json(results);
  //   } catch (error: any) {
  //     console.error(`Erro no controller ao processar o arquivo:`, error.message);
  //     return res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
  //       statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
  //       message: error.message || 'Erro interno ao processar o arquivo.',
  //     });
  //   }
  // }

  // @Get('history')
  // @ApiOperation({
  //   summary: 'Lista TODOS os históricos de importações de arquivos (Apenas RH, sem paginação)',
  // })
  // async getImportHistory(@Res() res: Response) {
  //   try {
  //     const history = await this.importService.getImportHistory();
  //     return res.status(HttpStatus.OK).json(history);
  //   } catch (error: any) {
  //     console.error(`Erro ao listar histórico de importações:`, error.message);
  //     return res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
  //       statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
  //       message: error.message || 'Erro interno ao listar o histórico de importações.',
  //     });
  //   }
  // }

  // @Get('history/:id')
  // @ApiOperation({ summary: 'Obtém detalhes de uma importação específica (Apenas RH)' })
  // @ApiParam({ name: 'id', description: 'ID do registro de histórico de importação', type: String })
  // async getImportHistoryDetails(@Param('id') id: string, @Res() res: Response) {
  //   try {
  //     const details = await this.importService.getImportHistoryDetails(id);
  //     return res.status(HttpStatus.OK).json(details);
  //   } catch (error: any) {
  //     console.error(`Erro ao obter detalhes do histórico de importação '${id}':`, error.message);
  //     return res.status(error.status || HttpStatus.NOT_FOUND).json({
  //       statusCode: error.status || HttpStatus.NOT_FOUND,
  //       message: error.message || `Histórico de importação com ID '${id}' não encontrado.`,
  //     });
  //   }
  // }

  // @Delete('history/:id')
  // @ApiOperation({
  //   summary: 'Deleta um registro de histórico de importação e seus dados associados (Apenas RH)',
  // })
  // @ApiParam({
  //   name: 'id',
  //   description: 'ID do registro de histórico de importação a ser deletado',
  //   type: String,
  // })
  // async deleteImportHistory(@Param('id') id: string, @Res() res: Response) {
  //   try {
  //     await this.importService.deleteImportHistoryById(id);
  //     return res.status(HttpStatus.NO_CONTENT).send();
  //   } catch (error: any) {
  //     console.error(`Erro ao deletar histórico de importação '${id}':`, error.message);
  //     return res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
  //       statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
  //       message: error.message || `Erro interno ao deletar o histórico de importação '${id}'.`,
  //     });
  //   }
  // }

  // ENDPOINTS DE IMPORTAÇÃO

  /**
   * Importa um único arquivo Excel de dados históricos
   */
  @Post('historical-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo XLS ou XLSX de histórico para importação',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Importa dados históricos de um único arquivo (Apenas RH)' })
  async uploadExcelFile(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: User) {
    return this.importService.processXslFile(file, user);
  }

  /**
   * Importa múltiplos arquivos Excel de dados históricos
   */
  @Post('historical-data/bulk')
  @UseInterceptors(FilesInterceptor('files', 20)) // Máximo de 20 arquivos
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
          description: 'Múltiplos arquivos XLS ou XLSX de histórico para importação (máximo 20)',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Importa dados históricos de múltiplos arquivos em lote (Apenas RH)' })
  async uploadMultipleExcelFiles(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @CurrentUser() user: User,
  ) {
    return this.importService.processMultipleXslFiles(files, user);
  }

  // ENDPOINTS DE CONSULTA DE LOTES

  /**
   * Lista todos os lotes de importação do usuário atual
   */
  @Get('batches/my')
  @ApiOperation({ summary: 'Lista os lotes de importação do usuário atual' })
  async getMyImportBatches(@CurrentUser() user: User) {
    return this.importService.getImportBatchesByUser(user.id);
  }

  /**
   * Lista todos os lotes de importação do sistema (apenas RH)
   */
  @Get('batches/all')
  @ApiOperation({ summary: 'Lista todos os lotes de importação do sistema (Apenas RH)' })
  async getAllImportBatches() {
    return this.importService.getAllImportBatches();
  }

  /**
   * Obtém detalhes de um lote específico
   */
  @Get('batches/:batchId')
  @ApiOperation({ summary: 'Obtém detalhes de um lote de importação específico' })
  @ApiParam({ name: 'batchId', description: 'ID do lote de importação' })
  async getImportBatchDetails(@Param('batchId') batchId: string) {
    return this.importService.getImportBatchDetails(batchId);
  }

  /**
   * Remove um lote de importação e todos os dados associados
   */
  @Delete('batches/:batchId')
  @ApiOperation({ summary: 'Remove um lote de importação e todos os dados associados' })
  @ApiParam({ name: 'batchId', description: 'ID do lote de importação a ser removido' })
  async deleteImportBatch(@Param('batchId') batchId: string, @CurrentUser() user: User) {
    await this.importService.deleteImportBatch(batchId, user.id);
    return { message: 'Lote de importação removido com sucesso' };
  }
}
