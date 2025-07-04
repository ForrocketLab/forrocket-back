import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UserService } from '../auth/user.service';
import { CyclesService } from '../evaluations/cycles/cycles.service';
import * as XLSX from 'xlsx';
import { ProjectsService } from '../projects/projects.service';
import { UserProfileRecord, SelfAssessmentRecord, Assessment360Record, ReferenceFeedbackRecord } from './interfaces/import-records.interface';
import { CriteriaMappingService } from '../evaluations/criteria-mapping/criteria-mapping.service';
import { CriteriaService } from '../evaluations/criteria.service';
import { EvaluationsService } from '../evaluations/evaluations.service';
import { ImportHistory, Prisma } from '@prisma/client';


@Injectable()
export class ImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly cyclesService: CyclesService,
    private readonly projectsService: ProjectsService,
    private readonly criteriaMappingService: CriteriaMappingService,
    private readonly criteriaService: CriteriaService,
    private readonly evaluationsService: EvaluationsService,
  ) {}

  /**
   * Processa um arquivo Excel (.xls ou .xlsx) para importar dados de perfis, autoavaliações,
   * avaliações 360 e pesquisas de referência.
   * @param fileName O nome do arquivo.
   * @param fileContent O conteúdo do arquivo como Buffer.
   * @param uploadedByEmail O email do usuário que está realizando a importação.
   * @returns Um objeto contendo os detalhes do ImportHistory criado.
   * @throws BadRequestException se o formato do arquivo não for suportado ou se houver erros de processamento.
   */
  async processExcelFile(fileName: string, fileContent: Buffer, uploadedByEmail: string): Promise<ImportHistory> {
    console.log('ImportService: processExcelFile - Nome do arquivo recebido:', fileName);

    const lowerCaseFileName = fileName.toLowerCase();
    
    let workbook: XLSX.WorkBook | null = null;
    let isExcel = false;


    const importHistory = await this.prisma.importHistory.create({
      data: {
        fileName: fileName,
        fileSize: fileContent.length,
        uploadedByEmail: uploadedByEmail,
        overallStatus: 'IN_PROGRESS', 
        totalSheetsProcessed: 0,
        totalRecordsCreated: 0,
        totalRecordsUpdated: 0,
        totalErrors: 0,
        details: {},
      },
    });

    let totalCreatedRecords = 0;
    let totalUpdatedRecords = 0;
    let totalErrorRecords = 0;
    let processedSheetsCount = 0;
    let overallStatus: ImportHistory['overallStatus'] = 'SUCCESS';
    const importDetails: Prisma.JsonObject = { sheets: [] };

    try {
      // Verifica se o arquivo é .xls ou .xlsx
      if (lowerCaseFileName.endsWith('.xlsx') || lowerCaseFileName.endsWith('.xls')) {
        isExcel = true;
        try {
          workbook = XLSX.read(fileContent, { type: 'buffer' });
          console.log(`ImportService: Arquivo Excel parseado. Planilhas disponíveis: ${workbook.SheetNames.join(', ')}`);
        } catch (error) {
          console.error('Erro ao parsear arquivo Excel:', error.message);
          throw new BadRequestException(`Erro ao processar arquivo Excel '${fileName}'. Verifique o formato do arquivo ou se ele está corrompido. Detalhes: ${error.message}`);
        }
      } else {
        throw new BadRequestException(`Formato de arquivo não suportado: '${fileName}'. Apenas .xls e .xlsx são aceitos.`);
      }

      if (!isExcel || !workbook) {
        throw new BadRequestException(`Nenhum workbook válido encontrado ou formato de arquivo não suportado para '${fileName}'.`);
      }

      const sheetsToProcess = workbook.SheetNames;

      if (sheetsToProcess.length === 0) {
        throw new BadRequestException(`Nenhuma planilha válida encontrada no arquivo '${fileName}'.`);
      }

      let mainUserEmail: string | null = null;
      let mainCycleIdentifier: string | null = null;

      const orderedSheets = sheetsToProcess.sort((a, b) => {
        if (a.toLowerCase().includes('perfil')) return -1;
        if (b.toLowerCase().includes('perfil')) return 1;
        return 0;
      });

      for (const sheetName of orderedSheets) {
        let records: any[] = [];
        let currentIdentifier = sheetName;
        let identifiedType: string | null = null;
        let sheetResult = {
          sheetName: currentIdentifier,
          status: 'error',
          message: 'Tipo de histórico não reconhecido ou erro desconhecido.',
          created: 0,
          updated: 0,
          errors: [] as any[],
        };

        try {
          const worksheet = workbook.Sheets[sheetName];
          if (!worksheet) {
            sheetResult.message = `Planilha '${currentIdentifier}' não encontrada no workbook.`;
            sheetResult.status = 'skipped';
            (importDetails.sheets as any[]).push(sheetResult);
            continue;
          }
          records = XLSX.utils.sheet_to_json(worksheet);

          console.log(`ImportService: Processando planilha Excel: '${currentIdentifier}'. Número de registros: ${records.length}`);
          if (records.length > 0) {
            const parsedHeaders = Object.keys(records[0]);
            console.log(`ImportService: Planilha Excel '${currentIdentifier}' - Cabeçalhos encontrados: [${parsedHeaders.map(h => `'${h}'`).join(', ')}]`);
          } else {
            records = [];
          }

          if (records.length === 0) {
            sheetResult.message = `Planilha '${currentIdentifier}' está vazia ou não pôde ser parseada em registros.`;
            sheetResult.status = 'skipped';
            (importDetails.sheets as any[]).push(sheetResult);
            continue;
          }

          const headers = Object.keys(records[0]);

          const lowerCaseSheetName = currentIdentifier.toLowerCase();

          if (lowerCaseSheetName.includes('perfil')) {
            identifiedType = 'Perfil';
          } else if (lowerCaseSheetName.includes('autoavaliação')) {
            identifiedType = 'Autoavaliação';
          } else if (lowerCaseSheetName.includes('avaliação 360')) {
            identifiedType = 'Avaliação 360';
          } else if (lowerCaseSheetName.includes('pesquisa de referências')) {
            identifiedType = 'Pesquisa de Referências';
          }

          if (!identifiedType) {
            if (headers.includes('Nome ( nome.sobrenome )') && headers.includes('Email') && headers.includes('Ciclo (ano.semestre)') && headers.includes('Unidade')) {
              identifiedType = 'Perfil';
            } else if (headers.includes('CRITÉRIO') && headers.includes('AUTO-AVALIAÇÃO')) {
              identifiedType = 'Autoavaliação';
            } else if (headers.includes('EMAIL DO AVALIADO ( nome.sobrenome )') && headers.includes('DÊ UMA NOTA GERAL PARA O COLABORADOR')) {
              identifiedType = 'Avaliação 360';
            } else if (headers.includes('EMAIL DA REFERÊNCIA\n( nome.sobrenome )') && headers.includes('JUSTIFICATIVA')) {
              identifiedType = 'Pesquisa de Referências';
            }
          }

          let importResultForSheet: { created: number; updated: number; errors: any[] };

          if (identifiedType === 'Perfil') {
            console.log(`ImportService: Identificado como 'Perfil' (Planilha: ${currentIdentifier}).`);
            importResultForSheet = await this.importPerfilImportado(records as UserProfileRecord[], importHistory.id);
            if (importResultForSheet.created > 0 || importResultForSheet.updated > 0) {
              if (records.length > 0) {
                mainUserEmail = records[0].Email;
                mainCycleIdentifier = records[0]['Ciclo (ano.semestre)'];
                console.log(`Info: Email Principal: ${mainUserEmail}, Ciclo Principal: ${mainCycleIdentifier}`);
              }
            }
          } else if (identifiedType === 'Autoavaliação') {
            console.log(`ImportService: Identificado como 'Autoavaliação' (Planilha: ${currentIdentifier}).`);
            if (!mainUserEmail || !mainCycleIdentifier) {
              throw new BadRequestException(`Autoavaliação requer que a planilha 'Perfil' seja processada primeiro para obter Email e Ciclo do usuário principal.`);
            }
            importResultForSheet = await this.importAutoAvaliacaoImportada(records as SelfAssessmentRecord[], mainUserEmail, mainCycleIdentifier, importHistory.id);
          } else if (identifiedType === 'Avaliação 360') {
            console.log(`ImportService: Identificado como 'Avaliação 360' (Planilha: ${currentIdentifier}).`);
            if (!mainUserEmail || !mainCycleIdentifier) {
              throw new BadRequestException(`Avaliação 360 requer que a planilha 'Perfil' seja processada primeiro para obter Email e Ciclo do usuário principal.`);
            }
            importResultForSheet = await this.importAvaliacao360Importada(records as Assessment360Record[], mainUserEmail, mainCycleIdentifier, importHistory.id);
          } else if (identifiedType === 'Pesquisa de Referências') {
            console.log(`ImportService: Identificado como 'Pesquisa de Referências' (Planilha: ${currentIdentifier}).`);
            if (!mainUserEmail || !mainCycleIdentifier) {
              throw new BadRequestException(`Pesquisa de Referências requer que a planilha 'Perfil' seja processada primeiro para obter Email e Ciclo do usuário principal.`);
            }
            importResultForSheet = await this.importPesquisaReferenciaImportada(records as ReferenceFeedbackRecord[], mainUserEmail, mainCycleIdentifier, importHistory.id);
          } else {
            const firstRecordSnippet = JSON.stringify(records.slice(0, 1), null, 2);
            throw new BadRequestException(
              `Tipo de histórico desconhecido para a planilha '${currentIdentifier}'. ` +
              `A estrutura de cabeçalhos não corresponde a nenhum tipo esperado. ` +
              `Cabeçalhos encontrados: [${headers.map(h => `'${h}'`).join(', ')}]. ` +
              `Primeiro(s) registro(s) para depuração: ${firstRecordSnippet}`
            );
          }

          sheetResult.status = importResultForSheet.errors.length === 0 ? 'success' : 'partial_success';
          sheetResult.created = importResultForSheet.created;
          sheetResult.updated = importResultForSheet.updated;
          sheetResult.errors = importResultForSheet.errors;
          sheetResult.message = `Processado ${importResultForSheet.created} criados, ${importResultForSheet.updated} atualizados, ${importResultForSheet.errors.length} erros.`;

          totalCreatedRecords += importResultForSheet.created;
          totalUpdatedRecords += importResultForSheet.updated;
          totalErrorRecords += importResultForSheet.errors.length;
          processedSheetsCount++;

          (importDetails.sheets as any[]).push(sheetResult);

        } catch (error) {
          console.error(`Erro ao processar planilha '${currentIdentifier}':`, error.message);
          sheetResult.status = 'error';
          sheetResult.message = error.message;
          sheetResult.errors.push({ record: records.length > 0 ? records[0] as any : null, message: error.message });
          totalErrorRecords++; 
          (importDetails.sheets as any[]).push(sheetResult);
          overallStatus = 'PARTIAL_SUCCESS';
        }
      }

      if (processedSheetsCount === 0) {
        throw new BadRequestException(`Nenhuma planilha pôde ser processada com sucesso no arquivo '${fileName}'.`);
      }

    } catch (error) {
      overallStatus = 'ERROR'; 
      (importDetails as any).errorMessage = error.message;
      throw error; 
    } finally {
      await this.prisma.importHistory.update({
        where: { id: importHistory.id },
        data: {
          overallStatus: totalErrorRecords > 0 ? 'PARTIAL_SUCCESS' : 'SUCCESS',
          totalSheetsProcessed: processedSheetsCount,
          totalRecordsCreated: totalCreatedRecords,
          totalRecordsUpdated: totalUpdatedRecords,
          totalErrors: totalErrorRecords,
          details: importDetails,
        },
      });
    }

    const updatedImportHistory = await this.prisma.importHistory.findUnique({ where: { id: importHistory.id } });
    if (!updatedImportHistory) {
      throw new BadRequestException(`Histórico de importação com ID '${importHistory.id}' não encontrado após atualização.`);
    }
    return updatedImportHistory;
  }

  /**
   * Lista o histórico de importações.
   * @param page Opcional. Número da página para paginação.
   * @param limit Opcional. Quantidade de registros por página.
   * @returns Uma lista paginada de registros ImportHistory.
   */
  async getImportHistory(): Promise<ImportHistory[]> { 
    console.log('Backend: [getImportHistory] Iniciando método (sem paginação).');
    try {
      console.log('Backend: [getImportHistory] Iniciando consulta Prisma para todos os registros.');
      const data = await this.prisma.importHistory.findMany({
        orderBy: { uploadDate: 'desc' }, 
      });
      console.log('Backend: [getImportHistory] Consulta Prisma concluída. Total de registros:', data.length);
      
      console.log('Backend: [getImportHistory] Retornando todos os dados.');
      return data; 
    } catch (error: any) {
      console.error('Backend: [getImportHistory] ERRO na consulta Prisma para todos os registros:', error.message);
      throw error; 
    }
  }

  /**
   * Obtém os detalhes de um registro de histórico de importação específico,
   * incluindo os registros de dados importados associados.
   * @param id O ID do registro ImportHistory.
   * @returns O registro ImportHistory com seus detalhes, ou null se não encontrado.
   */
  async getImportHistoryDetails(id: string): Promise<ImportHistory & {
    perfisImportados: Prisma.PerfilImportadoGetPayload<{}>[];
    autoAvaliacoesImportadas: Prisma.AutoAvaliacaoImportadaGetPayload<{}>[];
    avaliacoes360Importadas: Prisma.Avaliacao360ImportadaGetPayload<{}>[];
    pesquisasReferenciaImportadas: Prisma.PesquisaReferenciaImportadaGetPayload<{}>[];
  } | null> {
    const importHistory = await this.prisma.importHistory.findUnique({
      where: { id: id },
      include: {
        perfisImportados: true,
        autoAvaliacoesImportadas: true,
        avaliacoes360Importadas: true,
        pesquisasReferenciaImportadas: true,
      },
    });

    if (!importHistory) {
      throw new BadRequestException(`Histórico de importação com ID '${id}' não encontrado.`);
    }

    return importHistory;
  }

  // --- Funções de Importação Específicas para as NOVAS TABELAS ---

  // 1. Importação de Perfis para 'PerfilImportado'
  private async importPerfilImportado(userData: UserProfileRecord[], importHistoryId: string): Promise<{ created: number; updated: number; errors: { record: any; message: string }[] }> {
    const results: { created: number; updated: number; errors: { record: any; message: string }[] } = { created: 0, updated: 0, errors: [] };

    for (const record of userData) {
      const email = record.Email;
      const name = record['Nome ( nome.sobrenome )'];
      const businessUnit = record.Unidade;
      const cycleIdentifier = record['Ciclo (ano.semestre)'];

      if (!email || !name || !businessUnit || !cycleIdentifier) {
        results.errors.push({ record: record as any, message: 'Campos essenciais (Email, Nome, Unidade, Ciclo) ausentes.' } as any);
        continue;
      }

      try {
        const existingPerfil = await this.prisma.perfilImportado.findUnique({
          where: { email: email },
        });

        if (existingPerfil) {
          await this.prisma.perfilImportado.update({
            where: { id: existingPerfil.id },
            data: {
              nome: name,
              unidade: businessUnit,
              ciclo: cycleIdentifier,
              importHistoryId: importHistoryId,
            },
          });
          results.updated++;
        } else {
          await this.prisma.perfilImportado.create({
            data: {
              nome: name,
              email: email,
              ciclo: cycleIdentifier,
              unidade: businessUnit,
              importHistoryId: importHistoryId,
            },
          });
          results.created++;
        }
      } catch (error) {
        results.errors.push({ record: record as any, message: `Erro ao processar perfil '${email}': ${error.message}` } as any);
      }
    }
    return results;
  }

  // 2. Importação de Autoavaliações para 'AutoAvaliacaoImportada'
  private async importAutoAvaliacaoImportada(assessmentData: SelfAssessmentRecord[], userEmail: string, cycleIdentifier: string, importHistoryId: string): Promise<{ created: number; updated: number; errors: { record: any; message: string }[] }> {
    const results: { created: number; updated: number; errors: { record: any; message: string }[] } = { created: 0, updated: 0, errors: [] };

    console.log('Backend: Iniciando importação de autoavaliações:', assessmentData.length, 'registros.');
    console.log(`Backend: Autoavaliação para usuário principal: ${userEmail}, Ciclo Principal: ${cycleIdentifier}`);

    for (const record of assessmentData) {
      const criterioNameFromSheet = record.CRITÉRIO;
      const autoAvaliacaoScoreValue = record['AUTO-AVALIAÇÃO'];
      const descricaoGeralText = record['DESCRIÇÃO GERAL'];
      const descricaoNotaText = record['DESCRIÇÃO NOTA'];
      const dadosFatosText = record['DADOS E FATOS DA AUTO-AVALIAÇÃO\nCITE, DE FORMA OBJETIVA, CASOS E SITUAÇÕES REAIS'];

      // Verifica se o score é 'NA' (case insensitive)
      const isNA = String(autoAvaliacaoScoreValue).toUpperCase() === 'NA';

      // Nova lógica de validação: dadosFatosText só é obrigatório se o score NÃO for 'NA'
      if (!criterioNameFromSheet || (autoAvaliacaoScoreValue === undefined || autoAvaliacaoScoreValue === null) || (!dadosFatosText && !isNA)) {
        let message = 'Campos essenciais ausentes.';
        if (!criterioNameFromSheet) message = 'CRITÉRIO ausente.';
        else if (autoAvaliacaoScoreValue === undefined || autoAvaliacaoScoreValue === null) message = 'AUTO-AVALIAÇÃO ausente.';
        else if (!dadosFatosText && !isNA) message = 'DADOS E FATOS DA AUTO-AVALIAÇÃO ausentes (obrigatório se a Auto-Avaliação não for "NA").';
        
        results.errors.push({ record: record as any, message: message } as any);
        continue;
      }

      try {
        const autoAvaliacaoScore = parseInt(String(autoAvaliacaoScoreValue));
        if (isNaN(autoAvaliacaoScore) || autoAvaliacaoScore < 1 || autoAvaliacaoScore > 5) {
          if (isNA) {
            console.warn(`Backend: Critério '${criterioNameFromSheet}': Autoavaliação como 'NA'.`);
            await this.prisma.autoAvaliacaoImportada.create({
              data: {
                emailColaborador: userEmail,
                ciclo: cycleIdentifier,
                criterio: criterioNameFromSheet,
                descricaoGeral: descricaoGeralText ?? '',
                autoAvaliacao: null,
                descricaoNota: descricaoNotaText,
                dadosFatosAutoAvaliacao: dadosFatosText, 
                importHistoryId: importHistoryId, 
              },
            });
            results.created++;
            continue;
          }
          // Se não for 'NA' e ainda assim for inválido, então é um erro
          results.errors.push({ record: record as any, message: `Valor de score inválido para '${criterioNameFromSheet}': '${autoAvaliacaoScoreValue}'. Esperado um número entre 1 e 5 ou 'NA'.` } as any);
          continue;
        }

        await this.prisma.autoAvaliacaoImportada.create({
          data: {
            emailColaborador: userEmail,
            ciclo: cycleIdentifier,
            criterio: criterioNameFromSheet,
            descricaoGeral: descricaoGeralText ?? '',
            autoAvaliacao: autoAvaliacaoScore,
            descricaoNota: descricaoNotaText,
            dadosFatosAutoAvaliacao: dadosFatosText,
            importHistoryId: importHistoryId,
          },
        });
        results.created++;

      } catch (error) {
        results.errors.push({ record: record as any, message: `Erro ao processar critério '${criterioNameFromSheet}' para autoavaliação: ${error.message}` } as any);
      }
    }
    return results;
  }

  // 3. Importação de Avaliações 360 para 'Avaliacao360Importada'
  private async importAvaliacao360Importada(assessmentData: Assessment360Record[], userEmail: string, cycleIdentifier: string, importHistoryId: string): Promise<{ created: number; updated: number; errors: { record: any; message: string }[] }> {
    const results: { created: number; updated: number; errors: { record: any; message: string }[] } = { created: 0, updated: 0, errors: [] };

    console.log('Iniciando importação de avaliações 360:', assessmentData.length);
    for (const record of assessmentData) {
      const emailAvaliado = record['EMAIL DO AVALIADO ( nome.sobrenome )'];
      const projetoAtuadoJunto = record['PROJETO EM QUE ATUARAM JUNTOS - OBRIGATÓRIO TEREM ATUADOS JUNTOS'];
      const periodo = record.PERÍODO;
      const motivadoEmTrabalharNovamente = record['VOCÊ FICARIA MOTIVADO EM TRABALHAR NOVAMENTE COM ESTE COLABORADOR'];
      const notaGeralColaboradorValue = record['DÊ UMA NOTA GERAL PARA O COLABORADOR'];
      const pontosMelhorar = record['PONTOS QUE DEVE MELHORAR'];
      const pontosExplorar = record['PONTOS QUE FAZ BEM E DEVE EXPLORAR'];


      if (!emailAvaliado || notaGeralColaboradorValue === undefined || notaGeralColaboradorValue === null) {
        results.errors.push({ record: record as any, message: 'Campos essenciais (EMAIL DO AVALIADO, DÊ UMA NOTA GERAL PARA O COLABORADOR) ausentes.' } as any);
        continue;
      }

      try {
        const notaGeral = Number(notaGeralColaboradorValue);
        if (isNaN(notaGeral) || notaGeral < 1 || notaGeral > 5) {
          results.errors.push({ record: record as any, message: `Nota geral inválida para '${emailAvaliado}': '${notaGeralColaboradorValue}'. Esperado um número entre 1 e 5.` } as any);
          continue;
        }

        await this.prisma.avaliacao360Importada.create({
          data: {
            emailColaborador: userEmail,
            ciclo: cycleIdentifier,
            emailAvaliado: emailAvaliado,
            projetoAtuadoJunto: projetoAtuadoJunto,
            periodo: periodo,
            motivadoEmTrabalharNovamente: motivadoEmTrabalharNovamente,
            notaGeralColaborador: notaGeral,
            pontosMelhorar: pontosMelhorar,
            pontosExplorar: pontosExplorar,
            importHistoryId: importHistoryId,
          },
        });
        results.created++;

      } catch (error) {
        results.errors.push({ record: record as any, message: `Erro ao processar avaliação 360 para '${userEmail}' avaliando '${emailAvaliado}': ${error.message}` } as any);
      }
    }
    return results;
  }

  // 4. Importação de Feedbacks de Referência para 'PesquisaReferenciaImportada'
  private async importPesquisaReferenciaImportada(feedbackData: ReferenceFeedbackRecord[], userEmail: string, cycleIdentifier: string, importHistoryId: string): Promise<{ created: number; updated: number; errors: { record: any; message: string }[] }> {
    const results: { created: number; updated: number; errors: { record: any; message: string }[] } = { created: 0, updated: 0, errors: [] };

    console.log('Iniciando importação de feedbacks de referência:', feedbackData.length);
    for (const record of feedbackData) {
      const emailReferencia = record['EMAIL DA REFERÊNCIA\n( nome.sobrenome )'];
      const justificativa = record.JUSTIFICATIVA;


      if (!emailReferencia || !justificativa) {
        results.errors.push({ record: record as any, message: 'Campos essenciais (EMAIL DA REFERÊNCIA, JUSTIFICATIVA) ausentes.' } as any);
        continue;
      }

      try {
        await this.prisma.pesquisaReferenciaImportada.create({
          data: {
            emailColaborador: userEmail,
            ciclo: cycleIdentifier,
            emailReferencia: emailReferencia,
            justificativa: justificativa,
            importHistoryId: importHistoryId,
          },
        });
        results.created++;

      } catch (error) {
        results.errors.push({ record: record as any, message: `Erro ao processar feedback de referência para '${userEmail}' referenciando '${emailReferencia}': ${error.message}` } as any);
      }
    }
    return results;
  }
}