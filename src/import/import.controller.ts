import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  UploadedFiles,
  UseInterceptors,
  UploadedFile,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiConsumes,
  ApiBody,
  ApiOperation,
  ApiBearerAuth,
  ApiTags,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { User } from '@prisma/client';

import { CurrentUser } from '../auth/current-user.decorator';
import { PaginationQueryDto, PaginatedResponseDto } from './dto/pagination.dto';
import { ImportService } from './import.service';
import { HRRoleGuard } from '../auth/guards/hr-role.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiBearerAuth()
@ApiTags('Importação')
@Controller('api/import')
@UseGuards(JwtAuthGuard, HRRoleGuard)
export class ImportController {
  constructor(private readonly importService: ImportService) {}
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

  /**
   * Lista todos os lotes de importação do usuário atual com paginação
   */
  @Get('batches/my')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Lista os lotes de importação do usuário atual com paginação' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número da página (começando em 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Número de itens por página (máximo 100)',
    example: 10,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['importedAt', 'fileName', 'status'],
    description: 'Campo para ordenação',
    example: 'importedAt',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Ordem da ordenação',
    example: 'desc',
  })
  async getMyImportBatches(
    @CurrentUser() user: User,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<any>> {
    const { page, limit, sortBy, sortOrder } = query;
    return this.importService.getImportBatchesByUserPaginated(
      user.id,
      page,
      limit,
      sortBy,
      sortOrder,
    );
  }

  /**
   * Lista todos os lotes de importação do usuário atual (sem paginação - compatibilidade)
   */
  @Get('batches/my/all')
  @ApiOperation({ summary: 'Lista todos os lotes de importação do usuário atual sem paginação' })
  async getMyImportBatchesAll(@CurrentUser() user: User) {
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
