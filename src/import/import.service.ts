import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Prisma, SelfAssessmentAnswer, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as xlsx from 'xlsx';

import { UserService } from '../auth/user.service';
import { PrismaService } from '../database/prisma.service';
import { CriteriaService } from '../evaluations/criteria.service';
import { CyclesService } from '../evaluations/cycles/cycles.service';
import { EvaluationsService } from '../evaluations/evaluations.service';
import { ProjectsService } from '../projects/projects.service';
import { criteriaMap } from './dto/criteriaMap';
import {
  CleanSelfAssessmentAnswer,
  Feedback360Data,
  ProfileData,
  SelfAssessmentData,
} from './dto/import-dtos.dto';

@Injectable()
export class ImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly cyclesService: CyclesService,
    private readonly projectsService: ProjectsService,
    // private readonly criteriaMappingService: CriteriaMappingService,
    private readonly criteriaService: CriteriaService,
    private readonly evaluationsService: EvaluationsService,
  ) {}
  private readonly logger = new Logger(ImportService.name);

  /**
   * Processa um arquivo Excel (.xls ou .xlsx) para importar dados de perfis, autoavaliações,
   * avaliações 360 e pesquisas de referência.
   * @param fileName O nome do arquivo.
   * @param fileContent O conteúdo do arquivo como Buffer.
   * @param uploadedByEmail O email do usuário que está realizando a importação.
   * @returns Um objeto contendo os detalhes do ImportHistory criado.
   * @throws BadRequestException se o formato do arquivo não for suportado ou se houver erros de processamento.
   */
  // async processExcelFile(
  //   fileName: string,
  //   fileContent: Buffer,
  //   uploadedByEmail: string,
  // ): Promise<ImportHistory> {
  //   console.log('ImportService: processExcelFile - Nome do arquivo recebido:', fileName);

  //   const lowerCaseFileName = fileName.toLowerCase();

  //   let workbook: XLSX.WorkBook | null = null;
  //   let isExcel = false;

  //   const importHistory = await this.prisma.importHistory.create({
  //     data: {
  //       fileName: fileName,
  //       fileSize: fileContent.length,
  //       uploadedByEmail: uploadedByEmail,
  //       overallStatus: 'IN_PROGRESS',
  //       totalSheetsProcessed: 0,
  //       totalRecordsCreated: 0,
  //       totalRecordsUpdated: 0,
  //       totalErrors: 0,
  //       details: {},
  //     },
  //   });

  //   let totalCreatedRecords = 0;
  //   let totalUpdatedRecords = 0;
  //   let totalErrorRecords = 0;
  //   let processedSheetsCount = 0;
  //   let overallStatus: ImportHistory['overallStatus'] = 'SUCCESS';
  //   const importDetails: Prisma.JsonObject = { sheets: [] };

  //   try {
  //     // Verifica se o arquivo é .xls ou .xlsx
  //     if (lowerCaseFileName.endsWith('.xlsx') || lowerCaseFileName.endsWith('.xls')) {
  //       isExcel = true;
  //       try {
  //         workbook = XLSX.read(fileContent, { type: 'buffer' });
  //         console.log(
  //           `ImportService: Arquivo Excel parseado. Planilhas disponíveis: ${workbook.SheetNames.join(', ')}`,
  //         );
  //       } catch (error) {
  //         console.error('Erro ao parsear arquivo Excel:', error.message);
  //         throw new BadRequestException(
  //           `Erro ao processar arquivo Excel '${fileName}'. Verifique o formato do arquivo ou se ele está corrompido. Detalhes: ${error.message}`,
  //         );
  //       }
  //     } else {
  //       throw new BadRequestException(
  //         `Formato de arquivo não suportado: '${fileName}'. Apenas .xls e .xlsx são aceitos.`,
  //       );
  //     }

  //     if (!isExcel || !workbook) {
  //       throw new BadRequestException(
  //         `Nenhum workbook válido encontrado ou formato de arquivo não suportado para '${fileName}'.`,
  //       );
  //     }

  //     const sheetsToProcess = workbook.SheetNames;

  //     if (sheetsToProcess.length === 0) {
  //       throw new BadRequestException(
  //         `Nenhuma planilha válida encontrada no arquivo '${fileName}'.`,
  //       );
  //     }

  //     let mainUserEmail: string | null = null;
  //     let mainCycleIdentifier: string | null = null;

  //     const orderedSheets = sheetsToProcess.sort((a, b) => {
  //       if (a.toLowerCase().includes('perfil')) return -1;
  //       if (b.toLowerCase().includes('perfil')) return 1;
  //       return 0;
  //     });

  //     for (const sheetName of orderedSheets) {
  //       let records: any[] = [];
  //       const currentIdentifier = sheetName;
  //       let identifiedType: string | null = null;
  //       const sheetResult = {
  //         sheetName: currentIdentifier,
  //         status: 'error',
  //         message: 'Tipo de histórico não reconhecido ou erro desconhecido.',
  //         created: 0,
  //         updated: 0,
  //         errors: [] as any[],
  //       };

  //       try {
  //         const worksheet = workbook.Sheets[sheetName];
  //         if (!worksheet) {
  //           sheetResult.message = `Planilha '${currentIdentifier}' não encontrada no workbook.`;
  //           sheetResult.status = 'skipped';
  //           (importDetails.sheets as any[]).push(sheetResult);
  //           continue;
  //         }
  //         records = XLSX.utils.sheet_to_json(worksheet);

  //         console.log(
  //           `ImportService: Processando planilha Excel: '${currentIdentifier}'. Número de registros: ${records.length}`,
  //         );
  //         if (records.length > 0) {
  //           const parsedHeaders = Object.keys(records[0]);
  //           console.log(
  //             `ImportService: Planilha Excel '${currentIdentifier}' - Cabeçalhos encontrados: [${parsedHeaders.map((h) => `'${h}'`).join(', ')}]`,
  //           );
  //         } else {
  //           records = [];
  //         }

  //         if (records.length === 0) {
  //           sheetResult.message = `Planilha '${currentIdentifier}' está vazia ou não pôde ser parseada em registros.`;
  //           sheetResult.status = 'skipped';
  //           (importDetails.sheets as any[]).push(sheetResult);
  //           continue;
  //         }

  //         const headers = Object.keys(records[0]);

  //         const lowerCaseSheetName = currentIdentifier.toLowerCase();

  //         if (lowerCaseSheetName.includes('perfil')) {
  //           identifiedType = 'Perfil';
  //         } else if (lowerCaseSheetName.includes('autoavaliação')) {
  //           identifiedType = 'Autoavaliação';
  //         } else if (lowerCaseSheetName.includes('avaliação 360')) {
  //           identifiedType = 'Avaliação 360';
  //         } else if (lowerCaseSheetName.includes('pesquisa de referências')) {
  //           identifiedType = 'Pesquisa de Referências';
  //         }

  //         if (!identifiedType) {
  //           if (
  //             headers.includes('Nome ( nome.sobrenome )') &&
  //             headers.includes('Email') &&
  //             headers.includes('Ciclo (ano.semestre)') &&
  //             headers.includes('Unidade')
  //           ) {
  //             identifiedType = 'Perfil';
  //           } else if (headers.includes('CRITÉRIO') && headers.includes('AUTO-AVALIAÇÃO')) {
  //             identifiedType = 'Autoavaliação';
  //           } else if (
  //             headers.includes('EMAIL DO AVALIADO ( nome.sobrenome )') &&
  //             headers.includes('DÊ UMA NOTA GERAL PARA O COLABORADOR')
  //           ) {
  //             identifiedType = 'Avaliação 360';
  //           } else if (
  //             headers.includes('EMAIL DA REFERÊNCIA\n( nome.sobrenome )') &&
  //             headers.includes('JUSTIFICATIVA')
  //           ) {
  //             identifiedType = 'Pesquisa de Referências';
  //           }
  //         }

  //         let importResultForSheet: { created: number; updated: number; errors: any[] };

  //         if (identifiedType === 'Perfil') {
  //           console.log(
  //             `ImportService: Identificado como 'Perfil' (Planilha: ${currentIdentifier}).`,
  //           );
  //           importResultForSheet = await this.importPerfilImportado(
  //             records as UserProfileRecord[],
  //             importHistory.id,
  //           );
  //           if (importResultForSheet.created > 0 || importResultForSheet.updated > 0) {
  //             if (records.length > 0) {
  //               mainUserEmail = records[0].Email;
  //               mainCycleIdentifier = records[0]['Ciclo (ano.semestre)'];
  //               console.log(
  //                 `Info: Email Principal: ${mainUserEmail}, Ciclo Principal: ${mainCycleIdentifier}`,
  //               );
  //             }
  //           }
  //         } else if (identifiedType === 'Autoavaliação') {
  //           console.log(
  //             `ImportService: Identificado como 'Autoavaliação' (Planilha: ${currentIdentifier}).`,
  //           );
  //           if (!mainUserEmail || !mainCycleIdentifier) {
  //             throw new BadRequestException(
  //               `Autoavaliação requer que a planilha 'Perfil' seja processada primeiro para obter Email e Ciclo do usuário principal.`,
  //             );
  //           }
  //           importResultForSheet = await this.importAutoAvaliacaoImportada(
  //             records as SelfAssessmentRecord[],
  //             mainUserEmail,
  //             mainCycleIdentifier,
  //             importHistory.id,
  //           );
  //         } else if (identifiedType === 'Avaliação 360') {
  //           console.log(
  //             `ImportService: Identificado como 'Avaliação 360' (Planilha: ${currentIdentifier}).`,
  //           );
  //           if (!mainUserEmail || !mainCycleIdentifier) {
  //             throw new BadRequestException(
  //               `Avaliação 360 requer que a planilha 'Perfil' seja processada primeiro para obter Email e Ciclo do usuário principal.`,
  //             );
  //           }
  //           importResultForSheet = await this.importAvaliacao360Importada(
  //             records as Assessment360Record[],
  //             mainUserEmail,
  //             mainCycleIdentifier,
  //             importHistory.id,
  //           );
  //         } else if (identifiedType === 'Pesquisa de Referências') {
  //           console.log(
  //             `ImportService: Identificado como 'Pesquisa de Referências' (Planilha: ${currentIdentifier}).`,
  //           );
  //           if (!mainUserEmail || !mainCycleIdentifier) {
  //             throw new BadRequestException(
  //               `Pesquisa de Referências requer que a planilha 'Perfil' seja processada primeiro para obter Email e Ciclo do usuário principal.`,
  //             );
  //           }
  //           importResultForSheet = await this.importPesquisaReferenciaImportada(
  //             records as ReferenceFeedbackRecord[],
  //             mainUserEmail,
  //             mainCycleIdentifier,
  //             importHistory.id,
  //           );
  //         } else {
  //           const firstRecordSnippet = JSON.stringify(records.slice(0, 1), null, 2);
  //           throw new BadRequestException(
  //             `Tipo de histórico desconhecido para a planilha '${currentIdentifier}'. ` +
  //               `A estrutura de cabeçalhos não corresponde a nenhum tipo esperado. ` +
  //               `Cabeçalhos encontrados: [${headers.map((h) => `'${h}'`).join(', ')}]. ` +
  //               `Primeiro(s) registro(s) para depuração: ${firstRecordSnippet}`,
  //           );
  //         }

  //         sheetResult.status =
  //           importResultForSheet.errors.length === 0 ? 'success' : 'partial_success';
  //         sheetResult.created = importResultForSheet.created;
  //         sheetResult.updated = importResultForSheet.updated;
  //         sheetResult.errors = importResultForSheet.errors;
  //         sheetResult.message = `Processado ${importResultForSheet.created} criados, ${importResultForSheet.updated} atualizados, ${importResultForSheet.errors.length} erros.`;

  //         totalCreatedRecords += importResultForSheet.created;
  //         totalUpdatedRecords += importResultForSheet.updated;
  //         totalErrorRecords += importResultForSheet.errors.length;
  //         processedSheetsCount++;

  //         (importDetails.sheets as any[]).push(sheetResult);
  //       } catch (error) {
  //         console.error(`Erro ao processar planilha '${currentIdentifier}':`, error.message);
  //         sheetResult.status = 'error';
  //         sheetResult.message = error.message;
  //         sheetResult.errors.push({
  //           record: records.length > 0 ? records[0] : null,
  //           message: error.message,
  //         });
  //         totalErrorRecords++;
  //         (importDetails.sheets as any[]).push(sheetResult);
  //         overallStatus = 'PARTIAL_SUCCESS';
  //       }
  //     }

  //     if (processedSheetsCount === 0) {
  //       throw new BadRequestException(
  //         `Nenhuma planilha pôde ser processada com sucesso no arquivo '${fileName}'.`,
  //       );
  //     }
  //   } catch (error) {
  //     overallStatus = 'ERROR';
  //     (importDetails as any).errorMessage = error.message;
  //     throw error;
  //   } finally {
  //     await this.prisma.importHistory.update({
  //       where: { id: importHistory.id },
  //       data: {
  //         overallStatus: totalErrorRecords > 0 ? 'PARTIAL_SUCCESS' : 'SUCCESS',
  //         totalSheetsProcessed: processedSheetsCount,
  //         totalRecordsCreated: totalCreatedRecords,
  //         totalRecordsUpdated: totalUpdatedRecords,
  //         totalErrors: totalErrorRecords,
  //         details: importDetails,
  //       },
  //     });
  //   }

  //   const updatedImportHistory = await this.prisma.importHistory.findUnique({
  //     where: { id: importHistory.id },
  //   });
  //   if (!updatedImportHistory) {
  //     throw new BadRequestException(
  //       `Histórico de importação com ID '${importHistory.id}' não encontrado após atualização.`,
  //     );
  //   }
  //   return updatedImportHistory;
  // }

  // /**
  //  * Lista o histórico de importações.
  //  * @param page Opcional. Número da página para paginação.
  //  * @param limit Opcional. Quantidade de registros por página.
  //  * @returns Uma lista paginada de registros ImportHistory.
  //  */
  // async getImportHistory(): Promise<ImportHistory[]> {
  //   console.log('Backend: [getImportHistory] Iniciando método (sem paginação).');
  //   try {
  //     console.log('Backend: [getImportHistory] Iniciando consulta Prisma para todos os registros.');
  //     const data = await this.prisma.importHistory.findMany({
  //       orderBy: { uploadDate: 'desc' },
  //     });
  //     console.log(
  //       'Backend: [getImportHistory] Consulta Prisma concluída. Total de registros:',
  //       data.length,
  //     );

  //     console.log('Backend: [getImportHistory] Retornando todos os dados.');
  //     return data;
  //   } catch (error: any) {
  //     console.error(
  //       'Backend: [getImportHistory] ERRO na consulta Prisma para todos os registros:',
  //       error.message,
  //     );
  //     throw error;
  //   }
  // }

  // /**
  //  * Obtém os detalhes de um registro de histórico de importação específico,
  //  * incluindo os registros de dados importados associados.
  //  * @param id O ID do registro ImportHistory.
  //  * @returns O registro ImportHistory com seus detalhes, ou null se não encontrado.
  //  */
  // async getImportHistoryDetails(id: string): Promise<
  //   | (ImportHistory & {
  //       perfisImportados: Prisma.PerfilImportadoGetPayload<{}>[];
  //       autoAvaliacoesImportadas: Prisma.AutoAvaliacaoImportadaGetPayload<{}>[];
  //       avaliacoes360Importadas: Prisma.Avaliacao360ImportadaGetPayload<{}>[];
  //       pesquisasReferenciaImportadas: Prisma.PesquisaReferenciaImportadaGetPayload<{}>[];
  //     })
  //   | null
  // > {
  //   const importHistory = await this.prisma.importHistory.findUnique({
  //     where: { id: id },
  //     include: {
  //       perfisImportados: true,
  //       autoAvaliacoesImportadas: true,
  //       avaliacoes360Importadas: true,
  //       pesquisasReferenciaImportadas: true,
  //     },
  //   });

  //   if (!importHistory) {
  //     throw new BadRequestException(`Histórico de importação com ID '${id}' não encontrado.`);
  //   }

  //   return importHistory;
  // }

  // /**
  //  * Deleta um registro ImportHistory pelo ID e, devido ao onDelete: Cascade,
  //  * deleta automaticamente os registros filhos associados.
  //  * @param id O ID do registro ImportHistory a ser deletado.
  //  * @returns O registro deletado.
  //  * @throws BadRequestException se o registro não for encontrado.
  //  */
  // async deleteImportHistoryById(id: string): Promise<ImportHistory> {
  //   console.log(`Backend: [deleteImportHistoryById] Iniciando exclusão para ID: ${id}`);
  //   try {
  //     const existingHistory = await this.prisma.importHistory.findUnique({
  //       where: { id: id },
  //     });

  //     if (!existingHistory) {
  //       console.log(`Backend: [deleteImportHistoryById] Histórico com ID '${id}' não encontrado.`);
  //       throw new BadRequestException(`Histórico de importação com ID '${id}' não encontrado.`);
  //     }

  //     const deletedRecord = await this.prisma.importHistory.delete({
  //       where: { id: id },
  //     });
  //     console.log(
  //       `Backend: [deleteImportHistoryById] Histórico e registros associados para ID '${id}' deletados com sucesso.`,
  //     );
  //     return deletedRecord;
  //   } catch (error: any) {
  //     console.error(
  //       `Backend: [deleteImportHistoryById] ERRO ao deletar histórico para ID '${id}':`,
  //       error.message,
  //     );
  //     throw error;
  //   }
  // }

  // // --- Funções de Importação Específicas para as NOVAS TABELAS ---

  // // 1. Importação de Perfis para 'PerfilImportado'
  // private async importPerfilImportado(
  //   userData: UserProfileRecord[],
  //   importHistoryId: string,
  // ): Promise<{ created: number; updated: number; errors: { record: any; message: string }[] }> {
  //   const results: {
  //     created: number;
  //     updated: number;
  //     errors: { record: any; message: string }[];
  //   } = { created: 0, updated: 0, errors: [] };

  //   for (const record of userData) {
  //     const email = record.Email;
  //     const name = record['Nome ( nome.sobrenome )'];
  //     const businessUnit = record.Unidade;
  //     const cycleIdentifier = record['Ciclo (ano.semestre)'];

  //     if (!email || !name || !businessUnit || !cycleIdentifier) {
  //       results.errors.push({
  //         record: record as any,
  //         message: 'Campos essenciais (Email, Nome, Unidade, Ciclo) ausentes.',
  //       } as any);
  //       continue;
  //     }

  //     try {
  //       const existingPerfil = await this.prisma.perfilImportado.findUnique({
  //         where: { email: email },
  //       });

  //       if (existingPerfil) {
  //         await this.prisma.perfilImportado.update({
  //           where: { id: existingPerfil.id },
  //           data: {
  //             nome: name,
  //             unidade: businessUnit,
  //             ciclo: cycleIdentifier,
  //             importHistoryId: importHistoryId,
  //           },
  //         });
  //         results.updated++;
  //       } else {
  //         await this.prisma.perfilImportado.create({
  //           data: {
  //             nome: name,
  //             email: email,
  //             ciclo: cycleIdentifier,
  //             unidade: businessUnit,
  //             importHistoryId: importHistoryId,
  //           },
  //         });
  //         results.created++;
  //       }
  //     } catch (error) {
  //       results.errors.push({
  //         record: record as any,
  //         message: `Erro ao processar perfil '${email}': ${error.message}`,
  //       } as any);
  //     }
  //   }
  //   return results;
  // }

  // // 2. Importação de Autoavaliações para 'AutoAvaliacaoImportada'
  // private async importAutoAvaliacaoImportada(
  //   assessmentData: SelfAssessmentRecord[],
  //   userEmail: string,
  //   cycleIdentifier: string,
  //   importHistoryId: string,
  // ): Promise<{ created: number; updated: number; errors: { record: any; message: string }[] }> {
  //   const results: {
  //     created: number;
  //     updated: number;
  //     errors: { record: any; message: string }[];
  //   } = { created: 0, updated: 0, errors: [] };

  //   console.log(
  //     'Backend: Iniciando importação de autoavaliações:',
  //     assessmentData.length,
  //     'registros.',
  //   );
  //   console.log(
  //     `Backend: Autoavaliação para usuário principal: ${userEmail}, Ciclo Principal: ${cycleIdentifier}`,
  //   );

  //   for (const record of assessmentData) {
  //     const criterioNameFromSheet = record.CRITÉRIO;
  //     const autoAvaliacaoScoreValue = record['AUTO-AVALIAÇÃO'];
  //     const descricaoGeralText = record['DESCRIÇÃO GERAL'];
  //     const descricaoNotaText = record['DESCRIÇÃO NOTA'];
  //     const dadosFatosText =
  //       record['DADOS E FATOS DA AUTO-AVALIAÇÃO\nCITE, DE FORMA OBJETIVA, CASOS E SITUAÇÕES REAIS'];

  //     // Verifica se o score é 'NA' (case insensitive)
  //     const isNA = String(autoAvaliacaoScoreValue).toUpperCase() === 'NA';

  //     // Nova lógica de validação: dadosFatosText só é obrigatório se o score NÃO for 'NA'
  //     if (
  //       !criterioNameFromSheet ||
  //       autoAvaliacaoScoreValue === undefined ||
  //       autoAvaliacaoScoreValue === null ||
  //       (!dadosFatosText && !isNA)
  //     ) {
  //       let message = 'Campos essenciais ausentes.';
  //       if (!criterioNameFromSheet) message = 'CRITÉRIO ausente.';
  //       else if (autoAvaliacaoScoreValue === undefined || autoAvaliacaoScoreValue === null)
  //         message = 'AUTO-AVALIAÇÃO ausente.';
  //       else if (!dadosFatosText && !isNA)
  //         message =
  //           'DADOS E FATOS DA AUTO-AVALIAÇÃO ausentes (obrigatório se a Auto-Avaliação não for "NA").';

  //       results.errors.push({ record: record as any, message: message } as any);
  //       continue;
  //     }

  //     try {
  //       const autoAvaliacaoScore = parseInt(String(autoAvaliacaoScoreValue));
  //       if (isNaN(autoAvaliacaoScore) || autoAvaliacaoScore < 1 || autoAvaliacaoScore > 5) {
  //         if (isNA) {
  //           console.warn(`Backend: Critério '${criterioNameFromSheet}': Autoavaliação como 'NA'.`);
  //           await this.prisma.autoAvaliacaoImportada.create({
  //             data: {
  //               emailColaborador: userEmail,
  //               ciclo: cycleIdentifier,
  //               criterio: criterioNameFromSheet,
  //               descricaoGeral: descricaoGeralText ?? '',
  //               autoAvaliacao: null,
  //               descricaoNota: descricaoNotaText,
  //               dadosFatosAutoAvaliacao: dadosFatosText,
  //               importHistoryId: importHistoryId,
  //             },
  //           });
  //           results.created++;
  //           continue;
  //         }
  //         // Se não for 'NA' e ainda assim for inválido, então é um erro
  //         results.errors.push({
  //           record: record as any,
  //           message: `Valor de score inválido para '${criterioNameFromSheet}': '${autoAvaliacaoScoreValue}'. Esperado um número entre 1 e 5 ou 'NA'.`,
  //         } as any);
  //         continue;
  //       }

  //       await this.prisma.autoAvaliacaoImportada.create({
  //         data: {
  //           emailColaborador: userEmail,
  //           ciclo: cycleIdentifier,
  //           criterio: criterioNameFromSheet,
  //           descricaoGeral: descricaoGeralText ?? '',
  //           autoAvaliacao: autoAvaliacaoScore,
  //           descricaoNota: descricaoNotaText,
  //           dadosFatosAutoAvaliacao: dadosFatosText,
  //           importHistoryId: importHistoryId,
  //         },
  //       });
  //       results.created++;
  //     } catch (error) {
  //       results.errors.push({
  //         record: record as any,
  //         message: `Erro ao processar critério '${criterioNameFromSheet}' para autoavaliação: ${error.message}`,
  //       } as any);
  //     }
  //   }
  //   return results;
  // }

  // // 3. Importação de Avaliações 360 para 'Avaliacao360Importada'
  // private async importAvaliacao360Importada(
  //   assessmentData: Assessment360Record[],
  //   userEmail: string,
  //   cycleIdentifier: string,
  //   importHistoryId: string,
  // ): Promise<{ created: number; updated: number; errors: { record: any; message: string }[] }> {
  //   const results: {
  //     created: number;
  //     updated: number;
  //     errors: { record: any; message: string }[];
  //   } = { created: 0, updated: 0, errors: [] };

  //   console.log('Iniciando importação de avaliações 360:', assessmentData.length);
  //   for (const record of assessmentData) {
  //     const emailAvaliado = record['EMAIL DO AVALIADO ( nome.sobrenome )'];
  //     const projetoAtuadoJunto =
  //       record['PROJETO EM QUE ATUARAM JUNTOS - OBRIGATÓRIO TEREM ATUADOS JUNTOS'];
  //     const periodo = record.PERÍODO;
  //     const motivadoEmTrabalharNovamente =
  //       record['VOCÊ FICARIA MOTIVADO EM TRABALHAR NOVAMENTE COM ESTE COLABORADOR'];
  //     const notaGeralColaboradorValue = record['DÊ UMA NOTA GERAL PARA O COLABORADOR'];
  //     const pontosMelhorar = record['PONTOS QUE DEVE MELHORAR'];
  //     const pontosExplorar = record['PONTOS QUE FAZ BEM E DEVE EXPLORAR'];

  //     if (
  //       !emailAvaliado ||
  //       notaGeralColaboradorValue === undefined ||
  //       notaGeralColaboradorValue === null
  //     ) {
  //       results.errors.push({
  //         record: record as any,
  //         message:
  //           'Campos essenciais (EMAIL DO AVALIADO, DÊ UMA NOTA GERAL PARA O COLABORADOR) ausentes.',
  //       } as any);
  //       continue;
  //     }

  //     try {
  //       const notaGeral = Number(notaGeralColaboradorValue);
  //       if (isNaN(notaGeral) || notaGeral < 1 || notaGeral > 5) {
  //         results.errors.push({
  //           record: record as any,
  //           message: `Nota geral inválida para '${emailAvaliado}': '${notaGeralColaboradorValue}'. Esperado um número entre 1 e 5.`,
  //         } as any);
  //         continue;
  //       }

  //       await this.prisma.avaliacao360Importada.create({
  //         data: {
  //           emailColaborador: userEmail,
  //           ciclo: cycleIdentifier,
  //           emailAvaliado: emailAvaliado,
  //           projetoAtuadoJunto: projetoAtuadoJunto,
  //           periodo: periodo,
  //           motivadoEmTrabalharNovamente: motivadoEmTrabalharNovamente,
  //           notaGeralColaborador: notaGeral,
  //           pontosMelhorar: pontosMelhorar,
  //           pontosExplorar: pontosExplorar,
  //           importHistoryId: importHistoryId,
  //         },
  //       });
  //       results.created++;
  //     } catch (error) {
  //       results.errors.push({
  //         record: record as any,
  //         message: `Erro ao processar avaliação 360 para '${userEmail}' avaliando '${emailAvaliado}': ${error.message}`,
  //       } as any);
  //     }
  //   }
  //   return results;
  // }

  // // 4. Importação de Feedbacks de Referência para 'PesquisaReferenciaImportada'
  // private async importPesquisaReferenciaImportada(
  //   feedbackData: ReferenceFeedbackRecord[],
  //   userEmail: string,
  //   cycleIdentifier: string,
  //   importHistoryId: string,
  // ): Promise<{ created: number; updated: number; errors: { record: any; message: string }[] }> {
  //   const results: {
  //     created: number;
  //     updated: number;
  //     errors: { record: any; message: string }[];
  //   } = { created: 0, updated: 0, errors: [] };

  //   console.log('Iniciando importação de feedbacks de referência:', feedbackData.length);
  //   for (const record of feedbackData) {
  //     const emailReferencia = record['EMAIL DA REFERÊNCIA\n( nome.sobrenome )'];
  //     const justificativa = record.JUSTIFICATIVA;

  //     if (!emailReferencia || !justificativa) {
  //       results.errors.push({
  //         record: record as any,
  //         message: 'Campos essenciais (EMAIL DA REFERÊNCIA, JUSTIFICATIVA) ausentes.',
  //       } as any);
  //       continue;
  //     }

  //     try {
  //       await this.prisma.pesquisaReferenciaImportada.create({
  //         data: {
  //           emailColaborador: userEmail,
  //           ciclo: cycleIdentifier,
  //           emailReferencia: emailReferencia,
  //           justificativa: justificativa,
  //           importHistoryId: importHistoryId,
  //         },
  //       });
  //       results.created++;
  //     } catch (error) {
  //       results.errors.push({
  //         record: record as any,
  //         message: `Erro ao processar feedback de referência para '${userEmail}' referenciando '${emailReferencia}': ${error.message}`,
  //       } as any);
  //     }
  //   }
  //   return results;
  // }

  // IMPORTAÇÃO DE ARQUIVOS

  /**
   * Processa um único arquivo Excel (.xls ou .xlsx)
   * @param file - Arquivo Excel enviado
   * @returns Resultado da importação
   */
  async processXslFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }

    return this.processSingleFile(file);
  }

  /**
   * Processa múltiplos arquivos Excel (.xls ou .xlsx)
   * @param files - Array de arquivos Excel enviados
   * @returns Resultado da importação com detalhes de cada arquivo
   */
  async processMultipleXslFiles(files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }

    this.logger.log(`Iniciando processamento de ${files.length} arquivo(s)...`);

    // 1. Criar um lote único para todos os arquivos
    const batchNames = files.map((f) => f.originalname).join(', ');
    const batch = await this.prisma.importBatch.create({
      data: {
        fileName: `Lote múltiplo: ${batchNames}`,
        status: 'PROCESSING',
      },
    });

    const results = {
      batchId: batch.id,
      totalFiles: files.length,
      successfulFiles: 0,
      failedFiles: 0,
      fileResults: [] as Array<{
        fileName: string;
        status: 'SUCCESS' | 'FAILED';
        message: string;
        userId?: string;
        userName?: string;
        error?: string;
      }>,
    };

    try {
      // 2. Processar cada arquivo individualmente
      for (const file of files) {
        try {
          this.logger.log(`Processando arquivo: ${file.originalname}`);

          const fileResult = await this.processSingleFileInBatch(file, batch.id);

          results.fileResults.push({
            fileName: file.originalname,
            status: 'SUCCESS',
            message: `Arquivo processado com sucesso para o usuário ${fileResult.userName}`,
            userId: fileResult.userId,
            userName: fileResult.userName,
          });

          results.successfulFiles++;
          this.logger.log(`✅ Arquivo ${file.originalname} processado com sucesso`);
        } catch (error: unknown) {
          const errorMessage =
            error && typeof error === 'object' && 'message' in error
              ? String((error as { message?: unknown }).message)
              : 'Erro desconhecido';

          results.fileResults.push({
            fileName: file.originalname,
            status: 'FAILED',
            message: `Falha ao processar arquivo`,
            error: errorMessage,
          });

          results.failedFiles++;
          this.logger.error(`❌ Erro ao processar arquivo ${file.originalname}: ${errorMessage}`);
        }
      }

      // 3. Atualizar status do lote baseado nos resultados
      const finalStatus = results.failedFiles === 0 ? 'COMPLETED' : 'FAILED';

      await this.prisma.importBatch.update({
        where: { id: batch.id },
        data: {
          status: finalStatus,
          notes: `Processados ${results.successfulFiles}/${results.totalFiles} arquivos com sucesso`,
        },
      });

      this.logger.log(
        `Processamento concluído: ${results.successfulFiles}/${results.totalFiles} arquivos processados com sucesso`,
      );

      return {
        message: `Processamento concluído: ${results.successfulFiles}/${results.totalFiles} arquivos processados com sucesso`,
        ...results,
      };
    } catch (error: unknown) {
      // 4. Em caso de erro geral, atualizar o status do lote
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message?: unknown }).message)
          : 'Erro desconhecido';

      await this.prisma.importBatch.update({
        where: { id: batch.id },
        data: { status: 'FAILED', notes: `Erro geral: ${errorMessage}` },
      });

      throw new InternalServerErrorException(`Falha no processamento do lote: ${errorMessage}`);
    }
  }

  /**
   * Processa um único arquivo (usado tanto para arquivo único quanto para cada arquivo em um lote)
   * @param file - Arquivo Excel
   * @param existingBatchId - ID de lote existente (opcional)
   * @returns Resultado da importação
   */
  private async processSingleFile(file: Express.Multer.File, existingBatchId?: string) {
    // --- PARTE 1: LER O ARQUIVO EXCEL ---
    const workbook = xlsx.read(file.buffer, { type: 'buffer' });
    const sheetNames = workbook.SheetNames;

    // Verifica se as abas esperadas existem
    const requiredSheets = ['Perfil', 'Autoavaliação', 'Avaliação 360', 'Pesquisa de Referências'];
    for (const sheetName of requiredSheets) {
      if (!sheetNames.includes(sheetName)) {
        throw new BadRequestException(
          `A aba obrigatória "${sheetName}" não foi encontrada no arquivo ${file.originalname}.`,
        );
      }
    }

    // Converte cada aba para um array de objetos JSON
    const profileData: ProfileData[] = xlsx.utils.sheet_to_json(workbook.Sheets['Perfil']);
    const selfAssessmentData: SelfAssessmentData[] = xlsx.utils.sheet_to_json(
      workbook.Sheets['Autoavaliação'],
    );
    const feedback360Data: Feedback360Data[] = xlsx.utils.sheet_to_json(
      workbook.Sheets['Avaliação 360'],
    );

    // --- PARTE 2: EXECUTAR A LÓGICA DE BANCO DE DADOS ---

    // 1. Criar ou usar lote existente
    const batch = existingBatchId
      ? await this.prisma.importBatch.findUnique({ where: { id: existingBatchId } })
      : await this.prisma.importBatch.create({
          data: { fileName: file.originalname, status: 'PROCESSING' },
        });

    if (!batch) {
      throw new InternalServerErrorException(
        'Não foi possível criar ou encontrar o lote de importação.',
      );
    }

    try {
      let user: User;
      let userName: string;

      // 2. Processar em transação
      await this.prisma.$transaction(async (tx) => {
        // Processe os usuários da aba 'Perfil'
        user = await this.processUser(tx, profileData, batch.id);
        userName = user.name;
        const userCycle = profileData[0]['Ciclo (ano.semestre)'];

        // Processe a autoavaliação
        const isUserManager = await this.processSelfAssessments(
          tx,
          selfAssessmentData,
          user.id,
          userCycle,
          batch.id,
        );

        // Processe os feedbacks 360
        await this.processFeedbacks360(
          tx,
          feedback360Data,
          user.id,
          userCycle,
          batch.id,
          isUserManager,
        );
      });

      // 3. Atualizar status para sucesso (apenas se for lote individual)
      if (!existingBatchId) {
        await this.prisma.importBatch.update({
          where: { id: batch.id },
          data: { status: 'COMPLETED' },
        });
      }

      return {
        message: 'Arquivo importado com sucesso!',
        userId: user!.id,
        userName: userName!,
        batchId: batch.id,
      };
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message?: unknown }).message)
          : 'Erro desconhecido';

      // Atualizar status para falha (apenas se for lote individual)
      if (!existingBatchId) {
        await this.prisma.importBatch.update({
          where: { id: batch.id },
          data: { status: 'FAILED', notes: errorMessage },
        });
      }

      throw new InternalServerErrorException(
        `Falha ao importar o arquivo ${file.originalname}: ${errorMessage}`,
      );
    }
  }

  /**
   * Versão do processamento de arquivo único para uso em lotes múltiplos
   * @param file - Arquivo Excel
   * @param batchId - ID do lote
   * @returns Resultado básico da importação
   */
  private async processSingleFileInBatch(file: Express.Multer.File, batchId: string) {
    return this.processSingleFile(file, batchId);
  }

  /**
   * Formata um nome convertendo de formato email para nome próprio
   * Exemplo: "ana.da" -> "Ana Da", "julia.sc" -> "Julia Sc"
   */
  private formatNameFromEmail(emailPrefix: string): string {
    if (!emailPrefix) return emailPrefix;

    return emailPrefix
      .split('.')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  // Métodos auxiliares que contêm a lógica de inserção no banco
  /**
   * Processa os dados de usuários da planilha 'Perfil'.
   * Usa a lógica "get or create" (upsert) para cada usuário.
   * @param tx - O cliente Prisma transacional.
   * @param data - Array de objetos da planilha de perfis.
   * @param batchId - ID do lote de importação para rastreabilidade.
   */
  private async processUser(
    tx: Prisma.TransactionClient,
    data: ProfileData[],
    batchId: string,
  ): Promise<User> {
    this.logger.log(`Processando usuário principal da planilha...`);

    if (data.length === 0) {
      throw new BadRequestException('A aba "Perfil" está vazia ou não foi encontrada.');
    }

    const mainProfile = data[0];
    const userEmail = mainProfile['Email']?.toLowerCase();

    if (!userEmail) {
      throw new BadRequestException(
        'O email do usuário principal é obrigatório e não foi encontrado.',
      );
    }

    // Apenas chama a função auxiliar com todos os detalhes disponíveis
    return this.findOrCreateUser(
      tx,
      {
        email: userEmail,
        name: mainProfile['Nome ( nome.sobrenome )'],
        businessUnit: mainProfile['Unidade'],
      },
      batchId,
    );
  }

  /**
   * Processa os dados da planilha 'Auto-avaliação' para um usuário específico.
   * @param tx - O cliente Prisma transacional.
   * @param data - Array de respostas da planilha de autoavaliação.
   * @param authorId - ID do autor da avaliação (deve ser obtido no fluxo principal).
   * @param cycle - Ciclo da avaliação (deve ser obtido da planilha 'Perfil' ou contexto).
   * @param batchId - ID do lote de importação.
   * @returns true se o usuário é gestor, false caso contrário
   */
  private async processSelfAssessments(
    tx: Prisma.TransactionClient,
    data: SelfAssessmentData[],
    authorId: string,
    cycle: string,
    batchId: string,
  ): Promise<boolean> {
    if (data.length === 0) return false;
    this.logger.log(`Processando autoavaliação para ${authorId} no ciclo ${cycle}...`);

    // 1. Cria ou atualiza a entidade principal 'SelfAssessment'.
    const selfAssessment = await tx.selfAssessment.upsert({
      where: { authorId_cycle: { authorId, cycle } },
      create: {
        authorId,
        cycle,
        status: 'SUBMITTED',
        importBatchId: batchId,
      },
      update: {
        status: 'SUBMITTED',
        importBatchId: batchId,
      },
    });

    // =================================================================
    // PASSO CHAVE 1: LIMPAR AS RESPOSTAS ANTIGAS
    // =================================================================
    // Antes de inserir os novos dados, apaga todas as respostas existentes para esta avaliação.
    // Isso garante que a re-importação comece do zero, evitando duplicações.
    this.logger.log(`Limpando respostas antigas para a avaliação ID: ${selfAssessment.id}`);
    await tx.selfAssessmentAnswer.deleteMany({
      where: {
        selfAssessmentId: selfAssessment.id,
      },
    });

    // Limpa e estrutura os dados da planilha.
    const cleanData: CleanSelfAssessmentAnswer[] = data.map((row) => ({
      criterion: row['CRITÉRIO'],
      score: row['AUTO-AVALIAÇÃO'],
      justification:
        row['DADOS E FATOS DA AUTO-AVALIAÇÃO\nCITE, DE FORMA OBJETIVA, CASOS E SITUAÇÕES REAIS'] ??
        '',
    }));

    // =================================================================
    // PASSO CHAVE 2: PRÉ-AGRUPAR RESPOSTAS EM MEMÓRIA
    // =================================================================
    // Este Map irá agrupar as justificativas para o mesmo critério novo.
    const processedAnswers = new Map<string, { score: number; justification: string }>();

    for (const row of cleanData) {
      const oldCriterionName = row.criterion;
      const criterionId = criteriaMap.get(oldCriterionName);

      if (!criterionId) {
        this.logger.warn(`Critério "${oldCriterionName}" não encontrado no mapa. Pulando.`);
        continue;
      }

      const numericScore = parseInt(String(row.score), 10);
      if (isNaN(numericScore)) {
        this.logger.warn(`Nota inválida para "${oldCriterionName}". Pulando.`);
        continue;
      }

      const justificationText = `[${oldCriterionName}]: ${row.justification}`;

      // Verifica se já processamos uma linha para este criterionId
      if (processedAnswers.has(criterionId)) {
        // Se sim, concatena a justificativa
        const existing = processedAnswers.get(criterionId)!;
        existing.justification += `\n\n${justificationText}`;
        // A nota da última entrada sobrescreve a anterior
        existing.score = numericScore;
      } else {
        // Se não, cria uma nova entrada no mapa
        processedAnswers.set(criterionId, {
          score: numericScore,
          justification: justificationText,
        });
      }
    }

    // =================================================================
    // PASSO CHAVE 3: CRIAR AS NOVAS RESPOSTAS NO BANCO
    // =================================================================
    // Agora, itera sobre os dados já agrupados e cria os registros no banco.
    const createPromises: Promise<SelfAssessmentAnswer>[] = [];
    for (const [criterionId, answerData] of processedAnswers.entries()) {
      createPromises.push(
        tx.selfAssessmentAnswer.create({
          data: {
            selfAssessmentId: selfAssessment.id,
            criterionId: criterionId,
            score: answerData.score,
            justification: answerData.justification,
          },
        }),
      );
    }

    await Promise.all(createPromises);

    // =================================================================
    // PASSO CHAVE 4: VERIFICAR SE É GESTOR E ATUALIZAR ROLES
    // =================================================================
    const isManager = await this.checkAndUpdateManagerRole(tx, authorId, data);

    this.logger.log(`Autoavaliação para ${authorId} processada e salva com sucesso.`);

    // Retorna se é gestor para uso em outras partes do código
    return isManager;
  }

  /**
   * Processa os dados da planilha 'Avaliação 360'.
   * Para cada linha, encontra o usuário avaliado e cria o registro de feedback 360.
   * @param tx - O cliente Prisma transacional.
   * @param data - Array de feedbacks 360 da planilha.
   * @param authorId - ID do autor dos feedbacks (o dono da planilha).
   * @param cycle - Ciclo da avaliação.
   * @param batchId - ID do lote de importação para rastreabilidade.
   * @param isUserManager - Se o usuário é gestor ou não (para definir role no projeto).
   */
  private async processFeedbacks360(
    tx: Prisma.TransactionClient,
    data: Feedback360Data[],
    authorId: string,
    cycle: string,
    batchId: string,
    isUserManager: boolean,
  ): Promise<void> {
    if (!data || data.length === 0) {
      this.logger.log('Nenhum dado de Feedback 360 para processar.');
      return;
    }
    this.logger.log(`Processando ${data.length} registros de feedback 360...`);

    for (const row of data) {
      const evaluatedUserEmail =
        row['EMAIL DO AVALIADO ( nome.sobrenome )']?.toLowerCase() + '@example.com';

      if (!evaluatedUserEmail) {
        this.logger.warn('Linha de feedback 360 sem email do avaliado. Pulando.');
        continue;
      }

      // =================================================================
      // PASSO CHAVE: Usa a função auxiliar para encontrar ou criar o usuário AVALIADO
      // =================================================================
      const evaluatedUser = await this.findOrCreateUser(
        tx,
        { email: evaluatedUserEmail }, // Passamos apenas o email; o nome será gerado se necessário
        batchId,
      );
      // Não precisamos mais verificar se `evaluatedUser` é nulo, pois a função auxiliar garante um retorno ou lança um erro.

      const overallScore = row['DÊ UMA NOTA GERAL PARA O COLABORADOR'];
      if (typeof overallScore !== 'number' || isNaN(overallScore)) {
        this.logger.warn(
          `Nota geral inválida para o avaliado "${evaluatedUserEmail}". Pulando feedback.`,
        );
        continue;
      }

      const strengthsText = row['PONTOS QUE FAZ BEM E DEVE EXPLORAR'];
      const improvementsText = row['PONTOS QUE DEVE MELHORAR'];

      // =================================================================
      // CRIAR PROJETO E ASSOCIAR USUÁRIOS
      // =================================================================
      const projectName = row['PROJETO EM QUE ATUARAM JUNTOS - OBRIGATÓRIO TEREM ATUADOS JUNTOS'];
      if (projectName && projectName.trim()) {
        await this.createProjectAndAssignUsers(
          tx,
          projectName.trim(),
          authorId,
          evaluatedUser.id,
          batchId,
          isUserManager,
        );
      }

      // A lógica de 'upsert' do feedback continua a mesma, mas agora é garantido
      // que `evaluatedUser.id` existe.
      await tx.assessment360.upsert({
        where: {
          authorId_evaluatedUserId_cycle: {
            authorId: authorId,
            evaluatedUserId: evaluatedUser.id,
            cycle: cycle,
          },
        },
        create: {
          authorId,
          evaluatedUserId: evaluatedUser.id,
          cycle,
          overallScore,
          strengths: strengthsText,
          improvements: improvementsText,
          status: 'SUBMITTED',
          isImported: true,
          importBatchId: batchId,
        },
        update: {
          overallScore,
          strengths: strengthsText,
          improvements: improvementsText,
          importBatchId: batchId,
        },
      });
    }

    this.logger.log('Processamento de feedbacks 360 concluído.');
  }

  /**
   * Cria um projeto se não existir e associa os usuários a ele.
   * Evita duplicatas tanto na criação do projeto quanto na associação de usuários.
   *
   * REGRA IMPORTANTE: Apenas o dono da planilha (author) tem role inferida baseada na autoavaliação.
   * Todas as pessoas avaliadas são sempre COLLABORATOR por padrão.
   * Quando essas pessoas importarem suas próprias planilhas, suas roles serão determinadas
   * pela análise da autoavaliação delas naquele momento.
   *
   * @param tx - O cliente Prisma transacional.
   * @param projectName - Nome do projeto.
   * @param authorId - ID do usuário autor (dono da planilha/avaliador).
   * @param evaluatedUserId - ID do usuário avaliado.
   * @param batchId - ID do lote de importação.
   * @param isAuthorManager - Se o autor é gestor (baseado na autoavaliação dele).
   */
  private async createProjectAndAssignUsers(
    tx: Prisma.TransactionClient,
    projectName: string,
    authorId: string,
    evaluatedUserId: string,
    batchId: string,
    isAuthorManager: boolean,
  ): Promise<void> {
    this.logger.log(`Criando/verificando projeto: "${projectName}"`);

    // 1. Criar ou encontrar o projeto
    const project = await tx.project.upsert({
      where: { name: projectName },
      create: {
        name: projectName,
        description: `Projeto criado automaticamente durante importação de feedback 360`,
        isActive: true,
      },
      update: {
        // Se o projeto já existe, mantém os dados atuais
      },
    });

    // 2. Definir a role do autor no projeto BASEADA APENAS na autoavaliação dele
    const authorProjectRole = isAuthorManager ? 'MANAGER' : 'COLLABORATOR';

    // 3. Associar o autor (dono da planilha) ao projeto
    await tx.userProjectAssignment.upsert({
      where: {
        userId_projectId: {
          userId: authorId,
          projectId: project.id,
        },
      },
      create: {
        userId: authorId,
        projectId: project.id,
      },
      update: {
        // Se a associação já existe, mantém os dados atuais
      },
    });

    // 4. Criar a role específica do autor no projeto (baseada na autoavaliação)
    await tx.userProjectRole.upsert({
      where: {
        userId_projectId_role: {
          userId: authorId,
          projectId: project.id,
          role: authorProjectRole,
        },
      },
      create: {
        userId: authorId,
        projectId: project.id,
        role: authorProjectRole,
      },
      update: {
        // Se a role já existe, mantém os dados atuais
      },
    });

    // 5. Associar o usuário avaliado ao projeto
    await tx.userProjectAssignment.upsert({
      where: {
        userId_projectId: {
          userId: evaluatedUserId,
          projectId: project.id,
        },
      },
      create: {
        userId: evaluatedUserId,
        projectId: project.id,
      },
      update: {
        // Se a associação já existe, mantém os dados atuais
      },
    });

    // 6. Criar a role do usuário avaliado no projeto (sempre COLLABORATOR - NÃO inferimos)
    // IMPORTANTE: Quando este usuário importar sua própria planilha, sua role será determinada
    // pela análise da autoavaliação dele naquele momento, não agora.
    await tx.userProjectRole.upsert({
      where: {
        userId_projectId_role: {
          userId: evaluatedUserId,
          projectId: project.id,
          role: 'COLLABORATOR',
        },
      },
      create: {
        userId: evaluatedUserId,
        projectId: project.id,
        role: 'COLLABORATOR',
      },
      update: {
        // Se a role já existe, mantém COLLABORATOR (não sobrescreve)
      },
    });

    this.logger.log(
      `Usuários associados ao projeto "${projectName}": ` +
        `${authorId} (${authorProjectRole} - baseado na autoavaliação) e ` +
        `${evaluatedUserId} (COLLABORATOR - role padrão, não inferida)`,
    );
  }

  /**
   * Função auxiliar centralizada para encontrar ou criar um usuário.
   * Se o usuário não existe, cria um placeholder com dados mínimos.
   * @returns O objeto User completo, seja ele encontrado ou recém-criado.
   */
  private async findOrCreateUser(
    tx: Prisma.TransactionClient,
    details: { email: string; name?: string; businessUnit?: string },
    batchId: string,
  ): Promise<User> {
    const { email, name, businessUnit } = details;

    // Se o nome não for fornecido ou parecer um email, gera a partir do email.
    let finalName = name;
    if (!finalName || finalName.includes('.') || finalName.length < 3) {
      const emailPrefix = email.split('@')[0];
      finalName = this.formatNameFromEmail(emailPrefix);
    }

    const user = await tx.user.upsert({
      where: { email },
      update: {
        // Se o usuário já existe, podemos decidir atualizar alguns dados
        name: finalName,
        businessUnit: businessUnit, // Atualiza se fornecido
      },
      create: {
        email,
        name: finalName,
        businessUnit: businessUnit || 'A ser definido',
        passwordHash: await bcrypt.hash('password123', 10), // Senha padrão segura
        roles: JSON.stringify(['colaborador']),
        jobTitle: 'A ser definido',
        seniority: 'A ser definido',
        careerTrack: 'A ser definido',
        isActive: false, // Começa inativo
        isImported: true,
        importBatchId: batchId,
      },
    });

    return user;
  }

  /**
   * Verifica se o usuário DONO DA PLANILHA é gestor baseado nos critérios de autoavaliação
   * e atualiza suas roles no sistema.
   *
   * IMPORTANTE: Esta função é chamada APENAS para o usuário que está importando sua própria planilha.
   * NÃO é usada para inferir roles de pessoas avaliadas no feedback 360.
   *
   * Critérios de gestão analisados:
   * - Gestão de Pessoas*
   * - Gestão de Projetos*
   * - Gestão Organizacional*
   * - Novos Clientes**
   * - Novos Projetos**
   * - Novos Produtos ou Serviços**
   *
   * @param tx - Cliente Prisma transacional
   * @param authorId - ID do usuário dono da planilha (quem está sendo analisado)
   * @param selfAssessmentData - Dados da autoavaliação do usuário
   * @returns true se o usuário é gestor, false caso contrário
   */
  private async checkAndUpdateManagerRole(
    tx: Prisma.TransactionClient,
    authorId: string,
    selfAssessmentData: SelfAssessmentData[],
  ): Promise<boolean> {
    // Critérios originais da planilha que identificam um gestor
    const managementCriteriaFromSheet = [
      'Gestão de Pessoas*',
      'Gestão de Projetos*',
      'Gestão Organizacional*',
      'Novos Clientes**',
      'Novos Projetos**',
      'Novos Produtos ou Serviços**',
    ];

    // Filtra apenas os critérios de gestão da planilha e verifica se têm notas válidas
    const managementCriteriaWithScores = selfAssessmentData
      .filter((row) => managementCriteriaFromSheet.includes(row['CRITÉRIO']))
      .map((row) => ({
        criterion: row['CRITÉRIO'],
        score: row['AUTO-AVALIAÇÃO'],
        hasValidScore:
          String(row['AUTO-AVALIAÇÃO']).toUpperCase() !== 'N/A' &&
          String(row['AUTO-AVALIAÇÃO']).toUpperCase() !== 'NA' &&
          !isNaN(Number(row['AUTO-AVALIAÇÃO'])),
      }));

    // Verifica quantos critérios de gestão têm notas válidas
    const criteriaWithValidScores = managementCriteriaWithScores.filter(
      (item) => item.hasValidScore,
    );

    let isManager = false;

    // Busca o usuário atual para atualizar roles
    const currentUser = await tx.user.findUnique({
      where: { id: authorId },
      select: { roles: true },
    });

    if (!currentUser) {
      this.logger.error(`Usuário ${authorId} não encontrado ao tentar atualizar roles.`);
      return false;
    }

    let currentRoles: string[] = [];
    try {
      currentRoles = JSON.parse(currentUser.roles || '[]') as string[];
    } catch {
      this.logger.warn(`Erro ao parsear roles do usuário ${authorId}. Usando array vazio.`);
      currentRoles = [];
    }

    // Garante que sempre tem pelo menos a role de COLLABORATOR
    if (!currentRoles.includes('colaborador')) {
      currentRoles.push('colaborador');
    }

    // Se existem critérios de gestão na planilha
    if (managementCriteriaWithScores.length > 0) {
      // NOVA LÓGICA: Se tem pelo menos UM critério de gestão válido, é gestor
      if (criteriaWithValidScores.length > 0) {
        isManager = true;
        this.logger.log(`Usuário ${authorId} identificado como gestor (${criteriaWithValidScores.length}/${managementCriteriaWithScores.length} critérios válidos). Atualizando roles...`);

        // Adiciona MANAGER se não existir
        if (!currentRoles.includes('gestor')) {
          currentRoles.push('gestor');
        }

        this.logger.log(`Usuário ${authorId} será atualizado para MANAGER apenas (sem COLLABORATOR).`);
      } else {
        // Se TODOS os critérios de gestão são N/A, mantém apenas como COLLABORATOR
        this.logger.log(
          `Usuário ${authorId} não tem nenhum critério de gestão válido. Mantém apenas como COLLABORATOR.`,
        );
      }
    } else {
      // Se não tem critérios de gestão na planilha, mantém apenas como COLLABORATOR
      this.logger.log(
        `Usuário ${authorId} não possui critérios de gestão na autoavaliação. Mantém apenas como COLLABORATOR.`,
      );
    }

    // Atualiza as roles no campo JSON do usuário
    await tx.user.update({
      where: { id: authorId },
      data: {
        roles: JSON.stringify(currentRoles),
      },
    });

    if (isManager) {
      // Se é gestor, APENAS cria/atualiza o UserRoleAssignment para MANAGER
      await tx.userRoleAssignment.upsert({
        where: { userId_role: { userId: authorId, role: 'MANAGER' } },
        create: { userId: authorId, role: 'MANAGER' },
        update: {},
      });

      // Remove a role de COLLABORATOR se existir (um manager não pode ser collaborator)
      await tx.userRoleAssignment.deleteMany({
        where: { 
          userId: authorId, 
          role: 'COLLABORATOR' 
        },
      });

      // Remove a role de COLLABORATOR de TODOS os projetos onde o usuário está
      const userProjects = await tx.userProjectRole.findMany({
        where: { 
          userId: authorId,
          role: 'COLLABORATOR'
        },
        select: { projectId: true }
      });

      if (userProjects.length > 0) {
        await tx.userProjectRole.deleteMany({
          where: {
            userId: authorId,
            role: 'COLLABORATOR'
          }
        });

        // Adiciona a role de MANAGER nos projetos onde era COLLABORATOR
        const managerRolePromises = userProjects.map(project =>
          tx.userProjectRole.upsert({
            where: {
              userId_projectId_role: {
                userId: authorId,
                projectId: project.projectId,
                role: 'MANAGER'
              }
            },
            create: {
              userId: authorId,
              projectId: project.projectId,
              role: 'MANAGER'
            },
            update: {}
          })
        );

        await Promise.all(managerRolePromises);
        
        this.logger.log(`Roles de COLLABORATOR removidas e substituídas por MANAGER em ${userProjects.length} projeto(s) para o usuário ${authorId}.`);
      }

      this.logger.log(`UserRoleAssignment criado/atualizado: ${authorId} como MANAGER (COLLABORATOR removido).`);
    } else {
      // SEMPRE cria/atualiza o UserRoleAssignment para COLLABORATOR (apenas se NÃO for manager)
      await tx.userRoleAssignment.upsert({
        where: { userId_role: { userId: authorId, role: 'COLLABORATOR' } },
        create: { userId: authorId, role: 'COLLABORATOR' },
        update: {},
      });

      this.logger.log(`UserRoleAssignment criado/atualizado: ${authorId} como COLLABORATOR.`);
    }

    return isManager;
  }
}
