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
// import { CriteriaMappingService } from '../evaluations/criteria-mapping/criteria-mapping.service';
import { CriteriaService } from '../evaluations/criteria.service';
import { CyclesService } from '../evaluations/cycles/cycles.service';
import { EvaluationsService } from '../evaluations/evaluations.service';
import { ProjectsService } from '../projects/projects.service';
import { criteriaMap } from './interfaces/criteriaMap';

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

  // MINHA IMPORTAÇÃO

  async processXslFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }

    // --- PARTE 1: LER O ARQUIVO EXCEL ---

    // Lê o arquivo a partir do buffer em memória
    const workbook = xlsx.read(file.buffer, { type: 'buffer' });

    // Pega o nome de todas as abas (páginas) da planilha
    const sheetNames = workbook.SheetNames;

    // Verifica se as abas esperadas existem
    const requiredSheets = ['Perfil', 'Autoavaliação', 'Avaliação 360', 'Pesquisa de Referências']; // Nomes exatos das suas abas
    for (const sheetName of requiredSheets) {
      if (!sheetNames.includes(sheetName)) {
        throw new BadRequestException(
          `A aba obrigatória "${sheetName}" não foi encontrada no arquivo.`,
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
    const referencesData: ReferenceData[] = xlsx.utils.sheet_to_json(
      workbook.Sheets['Pesquisa de Referências'],
    );

    // --- PARTE 2: EXECUTAR A LÓGICA DE BANCO DE DADOS ---

    // Agora você tem os dados de cada aba em variáveis separadas e estruturadas.
    // Você pode passar esses arrays para a sua lógica transacional.

    // 1. Criar o Lote de Importação
    const batch = await this.prisma.importBatch.create({
      data: { fileName: file.originalname, status: 'PROCESSING' },
    });

    try {
      // 2. Iniciar a transação
      await this.prisma.$transaction(async (tx) => {
        // Pré-carregue seus mapeamentos aqui (ex: critérios)

        // Processe os usuários da aba 'Perfil' (lógica "get or create")
        const user = await this.processUser(tx, profileData, batch.id);
        const userCycle = profileData[0]['Ciclo (ano.semestre)'];

        // Processe a autoavaliação
        await this.processSelfAssessments(tx, selfAssessmentData, user.id, userCycle, batch.id);

        // Processe os feedbacks 360
        await this.processFeedbacks360(tx, feedback360Data, user.id, userCycle, batch.id);

        //
        await this.processReferences(tx, referencesData, user.id, userCycle, batch.id);
      });

      // 3. Atualizar o status do lote para SUCESSO
      await this.prisma.importBatch.update({
        where: { id: batch.id },
        data: { status: 'COMPLETED' },
      });

      return { message: 'Arquivo importado com sucesso!' };
    } catch (error: unknown) {
      // 4. Em caso de erro, atualizar o status do lote para FALHA
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message?: unknown }).message)
          : 'Erro desconhecido';
      await this.prisma.importBatch.update({
        where: { id: batch.id },
        data: { status: 'FAILED', notes: errorMessage },
      });
      throw new InternalServerErrorException(`Falha ao importar o arquivo: ${errorMessage}`);
    }
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
   */
  private async processSelfAssessments(
    tx: Prisma.TransactionClient,
    data: SelfAssessmentData[],
    authorId: string,
    cycle: string,
    batchId: string,
  ): Promise<void> {
    if (data.length === 0) return;
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
    this.logger.log(`Autoavaliação para ${authorId} processada e salva com sucesso.`);
  }

  /**
   * Processa os dados da planilha 'Avaliação 360'.
   * Para cada linha, encontra o usuário avaliado e cria o registro de feedback 360.
   * @param tx - O cliente Prisma transacional.
   * @param data - Array de feedbacks 360 da planilha.
   * @param authorId - ID do autor dos feedbacks (o dono da planilha).
   * @param cycle - Ciclo da avaliação.
   * @param batchId - ID do lote de importação para rastreabilidade.
   */
  private async processFeedbacks360(
    tx: Prisma.TransactionClient,
    data: Feedback360Data[],
    authorId: string,
    cycle: string,
    batchId: string,
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
   * Processa os dados da planilha 'Pesquisa de Referências'.
   * Para cada linha, encontra ou cria o usuário que deu a referência (autor)
   * e cria o registro de feedback para o usuário principal (referenciado).
   * @param tx - O cliente Prisma transacional.
   * @param data - Array de referências da planilha.
   * @param referencedUserId - ID do usuário principal que está sendo referenciado.
   * @param cycle - Ciclo da avaliação.
   * @param batchId - ID do lote de importação.
   */
  private async processReferences(
    tx: Prisma.TransactionClient,
    data: ReferenceData[],
    referencedUserId: string, // Este é o usuário principal da importação
    cycle: string,
    batchId: string,
  ): Promise<void> {
    if (!data || data.length === 0) {
      this.logger.log('Nenhum dado de Pesquisa de Referências para processar.');
      return;
    }
    this.logger.log(`Processando ${data.length} registros de referência...`);

    for (const row of data) {
      // Extrai o prefixo do email da coluna com quebra de linha
      const authorEmailPrefix = row['EMAIL DA REFERÊNCIA\n( nome.sobrenome )']?.toLowerCase();

      if (!authorEmailPrefix) {
        this.logger.warn('Linha de referência sem email do autor. Pulando.');
        continue;
      }

      // Constrói o email completo.
      // Assumindo que o domínio padrão é @example.com, como em outras funções.
      const authorEmail = `${authorEmailPrefix}@example.com`;

      // 1. Encontra ou cria o usuário AUTOR da referência.
      const author = await this.findOrCreateUser(
        tx,
        { email: authorEmail }, // Passamos apenas o email. O nome será gerado se o usuário for novo.
        batchId,
      );

      const justification = row['JUSTIFICATIVA'];
      if (!justification) {
        this.logger.warn(`Justificativa vazia para a referência de "${authorEmail}". Pulando.`);
        continue;
      }

      // 2. Usa 'upsert' para criar ou atualizar o feedback de referência.
      // A chave única previne que a mesma pessoa dê a mesma referência no mesmo ciclo mais de uma vez.
      await tx.referenceFeedback.upsert({
        where: {
          authorId_referencedUserId_cycle: {
            authorId: author.id,
            referencedUserId: referencedUserId,
            cycle: cycle,
          },
        },
        create: {
          authorId: author.id,
          referencedUserId: referencedUserId,
          cycle,
          justification,
          status: 'SUBMITTED',
          isImported: true,
          importBatchId: batchId,
          submittedAt: new Date(),
        },
        update: {
          // Se já existir, atualiza a justificativa com a da planilha mais recente.
          justification,
          importBatchId: batchId,
          updatedAt: new Date(),
        },
      });
    }

    this.logger.log('Processamento de referências concluído.');
  }
}

// Supondo que você tenha os tipos para os dados de cada aba
interface ProfileData {
  'Nome ( nome.sobrenome )': string;
  Email: string;
  'Ciclo (ano.semestre)': string;
  Unidade: string;
}

interface SelfAssessmentData {
  CRITÉRIO: string;
  'DESCRIÇÃO GERAL': string;
  'AUTO-AVALIAÇÃO': number;
  'DESCRIÇÃO NOTA': string;
  'DADOS E FATOS DA AUTO-AVALIAÇÃO\nCITE, DE FORMA OBJETIVA, CASOS E SITUAÇÕES REAIS': string;
}

interface Feedback360Data {
  'EMAIL DO AVALIADO ( nome.sobrenome )': string;
  'PROJETO EM QUE ATUARAM JUNTOS - OBRIGATÓRIO TEREM ATUADOS JUNTOS': string;
  PERÍODO: number;
  'VOCÊ FICARIA MOTIVADO EM TRABALHAR NOVAMENTE COM ESTE COLABORADOR': string;
  'DÊ UMA NOTA GERAL PARA O COLABORADOR': number;
  'PONTOS QUE DEVE MELHORAR': string;
  'PONTOS QUE FAZ BEM E DEVE EXPLORAR': string;
}

interface ReferenceData {
  'EMAIL DA REFERÊNCIA\n( nome.sobrenome )': string;
  JUSTIFICATIVA: string;
}

interface CleanSelfAssessmentAnswer {
  criterion: string;
  description?: string;
  score?: number;
  scoreDescription?: string;
  justification?: string;
}

interface CleanReferenceData {
  emailReference: string;
  justification: string;
}
