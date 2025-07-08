import {
  Controller,
  Post,
  UseGuards,
  UploadedFiles,
  UseInterceptors,
  HttpStatus,
  Res,
  Body,
  Get,
  Query,
  Param,
  Delete,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiConsumes,
  ApiBody,
  ApiOperation,
  ApiBearerAuth,
  ApiTags,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { Response } from 'express';

import { ImportService } from './import.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../auth/entities/user.entity';
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

  //MEU IMPORT
  @Post('historical-data')
  @UseInterceptors(FileInterceptor('file')) // 'file' é o nome do campo no form-data
  async uploadExcelFile(@UploadedFile() file: Express.Multer.File) {
    // O arquivo 'file' contém o buffer de dados que precisamos
    return this.importService.processXslFile(file);
  }
}
