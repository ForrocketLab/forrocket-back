import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UserService } from '../auth/user.service';
import { CyclesService } from '../evaluations/cycles/cycles.service';
import * as csvParser from 'csv-parser';
import { Readable } from 'stream';
import * as XLSX from 'xlsx';
import { CreateUserDto, UserType, ProjectAssignmentDto } from '../auth/dto/create-user.dto';
import { UpdateUserData } from '../common/types/user.types';
import { CreateEvaluationCycleDto } from '../evaluations/cycles/dto/evaluation-cycle.dto';
import { ProjectsService } from '../projects/projects.service';
import { UserProfileRecord, SelfAssessmentRecord, Assessment360Record, ReferenceFeedbackRecord } from './interfaces/import-records.interface'; 
import { CriteriaMappingService } from '../evaluations/criteria-mapping/criteria-mapping.service';
import { CriteriaService } from '../evaluations/criteria.service';
import { EvaluationsService } from '../evaluations/evaluations.service';
import { CreateSelfAssessmentDto } from '../evaluations/assessments/dto/create-self-assessment.dto'; 
import { Create360AssessmentDto } from '../evaluations/assessments/dto/create-360-assessment.dto'; 
import { CreateReferenceFeedbackDto } from '../evaluations/assessments/dto/create-reference-feedback.dto'; 
import { validateSync } from 'class-validator';
import { addDays } from 'date-fns';


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

  async processCsvFile(fileName: string, fileContent: string | Buffer): Promise<any> {
    console.log('ImportService: processFile - Nome do arquivo recebido:', fileName);

    const lowerCaseFileName = fileName.toLowerCase(); 
    const resultsForAllFiles: any[] = [];

    let workbook: XLSX.WorkBook | null = null;
    let csvRecords: any[] = [];
    let isXLSX = false;

    if (lowerCaseFileName.endsWith('.xlsx')) {
      isXLSX = true;
      try {
        workbook = XLSX.read(fileContent as Buffer, { type: 'buffer' });
        console.log(`ImportService: Arquivo XLSX parseado. Planilhas disponíveis: ${workbook.SheetNames.join(', ')}`);
      } catch (error) {
        console.error('Erro ao parsear arquivo XLSX:', error.message);
        throw new BadRequestException(`Erro ao processar arquivo XLSX '${fileName}'. Verifique o formato do arquivo ou se ele está corrompido. Detalhes: ${error.message}`);
      }
    } else if (lowerCaseFileName.endsWith('.csv')) {
      csvRecords = await this.parseCsv(fileContent as string);
      console.log('ImportService: Arquivo CSV parseado.');
    } else {
      throw new BadRequestException(`Formato de arquivo não suportado: '${fileName}'. Apenas .csv e .xlsx são aceitos.`);
    }

    const sheetsToProcess = isXLSX ? workbook!.SheetNames : [fileName];

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

    for (const sheetOrFileName of orderedSheets) {
      let records: any[] = [];
      let currentIdentifier = sheetOrFileName;
      let identifiedType: string | null = null;

      try {
        if (isXLSX) {
          const worksheet = workbook!.Sheets[sheetOrFileName]; 
          if (!worksheet) { 
            resultsForAllFiles.push({ fileName: currentIdentifier, status: 'skipped', message: `Planilha '${currentIdentifier}' não encontrada no workbook.` });
            continue;
          }
          records = XLSX.utils.sheet_to_json(worksheet);
          
          console.log(`ImportService: Processando planilha XLSX: '${currentIdentifier}'. Número de registros: ${records.length}`);
          if (records.length > 0) {
            const parsedHeaders = Object.keys(records[0]);
            console.log(`ImportService: Planilha XLSX '${currentIdentifier}' - Cabeçalhos encontrados: [${parsedHeaders.map(h => `'${h}'`).join(', ')}]`);
          } else {
              records = [];
          }

        } else {
          records = csvRecords;
          console.log(`ImportService: Processando arquivo CSV: '${currentIdentifier}'. Número de registros: ${records.length}`);
        }
        
        if (records.length === 0) {
          resultsForAllFiles.push({ fileName: currentIdentifier, status: 'skipped', message: `Planilha/Arquivo '${currentIdentifier}' está vazio ou não pôde ser parseado em registros.` });
          continue;
        }

        const headers = Object.keys(records[0]);
        
        const lowerCaseIdentifier = currentIdentifier.toLowerCase();

        if (lowerCaseIdentifier.includes('perfil')) {
          identifiedType = 'Perfil';
        } else if (lowerCaseIdentifier.includes('autoavaliação')) {
          identifiedType = 'Autoavaliação';
        } else if (lowerCaseIdentifier.includes('avaliação 360')) {
          identifiedType = 'Avaliação 360';
        } else if (lowerCaseIdentifier.includes('pesquisa de referências')) {
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

        let importResult: any = { status: 'error', message: 'Tipo de histórico não reconhecido.', fileName: currentIdentifier };

        if (identifiedType === 'Perfil') {
          console.log(`ImportService: Identificado como 'Perfil' (Planilha/Arquivo: ${currentIdentifier}).`);
          const perfilResult = await this.importPerfilImportado(records as UserProfileRecord[]);
          if (perfilResult.created > 0 || perfilResult.updated > 0) {
            if (records.length > 0) {
                mainUserEmail = records[0].Email;
                mainCycleIdentifier = records[0]['Ciclo (ano.semestre)'];
                console.log(`Info: Email Principal: ${mainUserEmail}, Ciclo Principal: ${mainCycleIdentifier}`);
            }
          }
          importResult = perfilResult;
          importResult.fileName = currentIdentifier;

        } else if (identifiedType === 'Autoavaliação') {
          console.log(`ImportService: Identificado como 'Autoavaliação' (Planilha/Arquivo: ${currentIdentifier}).`);
          if (!mainUserEmail || !mainCycleIdentifier) {
              throw new BadRequestException(`Autoavaliação requer que a planilha 'Perfil' seja processada primeiro para obter Email e Ciclo do usuário principal.`);
          }
          importResult = await this.importAutoAvaliacaoImportada(records as SelfAssessmentRecord[], mainUserEmail, mainCycleIdentifier); 
          importResult.fileName = currentIdentifier;

        } else if (identifiedType === 'Avaliação 360') {
          console.log(`ImportService: Identificado como 'Avaliação 360' (Planilha/Arquivo: ${currentIdentifier}).`);
          if (!mainUserEmail || !mainCycleIdentifier) {
              throw new BadRequestException(`Avaliação 360 requer que a planilha 'Perfil' seja processada primeiro para obter Email e Ciclo do usuário principal.`);
          }
          importResult = await this.importAvaliacao360Importada(records as Assessment360Record[], mainUserEmail, mainCycleIdentifier); 
          importResult.fileName = currentIdentifier;

        } else if (identifiedType === 'Pesquisa de Referências') {
          console.log(`ImportService: Identificado como 'Pesquisa de Referências' (Planilha/Arquivo: ${currentIdentifier}).`);
          if (!mainUserEmail || !mainCycleIdentifier) {
              throw new BadRequestException(`Pesquisa de Referências requer que a planilha 'Perfil' seja processada primeiro para obter Email e Ciclo do usuário principal.`);
          }
          importResult = await this.importPesquisaReferenciaImportada(records as ReferenceFeedbackRecord[], mainUserEmail, mainCycleIdentifier); 
          importResult.fileName = currentIdentifier;

        } else {
          const firstRecordSnippet = JSON.stringify(records.slice(0, 1), null, 2);
          throw new BadRequestException(
            `Tipo de histórico desconhecido para a planilha/arquivo '${currentIdentifier}'. ` +
            `A estrutura de cabeçalhos não corresponde a nenhum tipo esperado. ` +
            `Cabeçalhos encontrados: [${headers.map(h => `'${h}'`).join(', ')}]. ` +
            `Primeiro(s) registro(s) para depuração: ${firstRecordSnippet}`
          );
        }
        resultsForAllFiles.push(importResult);

      } catch (error) {
        console.error(`Erro ao processar planilha/arquivo '${currentIdentifier}':`, error.message);
        resultsForAllFiles.push({ fileName: currentIdentifier, status: 'error', record: records.length > 0 ? records[0] as any : null, message: error.message } as any);
      }

      if (!isXLSX) {
        break;
      }
    }

    if (resultsForAllFiles.length === 0) {
      throw new BadRequestException(`Nenhuma planilha/arquivo pôde ser processado(a) com sucesso no '${fileName}'.`);
    }

    return resultsForAllFiles;
  }

  private async parseCsv(csvString: string): Promise<any[]> {
    const records: any[] = [];
    const stream = Readable.from(csvString);

    return new Promise((resolve, reject) => {
      stream
        .pipe(csvParser())
        .on('data', (data) => records.push(data))
        .on('end', () => resolve(records))
        .on('error', (error) => reject(error));
    });
  }

  // --- Funções de Importação Específicas para as NOVAS TABELAS ---

  // 1. Importação de Perfis para 'PerfilImportado'
  private async importPerfilImportado(userData: UserProfileRecord[]): Promise<any> {
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
  private async importAutoAvaliacaoImportada(assessmentData: SelfAssessmentRecord[], userEmail: string, cycleIdentifier: string): Promise<any> {
    const results: { created: number; updated: number; errors: { record: any; message: string }[] } = { created: 0, updated: 0, errors: [] };

    console.log('Iniciando importação de autoavaliações:', assessmentData.length, 'registros.');
    console.log(`Autoavaliação para usuário principal: ${userEmail}, Ciclo Principal: ${cycleIdentifier}`);

    for (const record of assessmentData) {
      const criterioNameFromSheet = record.CRITÉRIO;
      const autoAvaliacaoScoreValue = record['AUTO-AVALIAÇÃO'];
      const descricaoGeralText = record['DESCRIÇÃO GERAL'];
      const descricaoNotaText = record['DESCRIÇÃO NOTA'];
      const dadosFatosText = record['DADOS E FATOS DA AUTO-AVALIAÇÃO\nCITE, DE FORMA OBJETIVA, CASOS E SITUAÇÕES REAIS'];

      if (!criterioNameFromSheet || autoAvaliacaoScoreValue === undefined || autoAvaliacaoScoreValue === null || !dadosFatosText) { 
        results.errors.push({ record: record as any, message: 'Campos essenciais do critério (CRITÉRIO, AUTO-AVALIAÇÃO, DADOS E FATOS...) ausentes.' } as any);
        continue;
      }
      
      try {
        const autoAvaliacaoScore = parseInt(String(autoAvaliacaoScoreValue));
        if (isNaN(autoAvaliacaoScore) || autoAvaliacaoScore < 1 || autoAvaliacaoScore > 5) {
            if (String(autoAvaliacaoScoreValue).toUpperCase() === 'NA') {
                console.warn(`Critério '${criterioNameFromSheet}': Autoavaliação como 'NA'.`);
                await this.prisma.autoAvaliacaoImportada.create({
                  data: {
                    emailColaborador: userEmail, 
                    ciclo: cycleIdentifier,
                    criterio: criterioNameFromSheet,
                    descricaoGeral: descricaoGeralText ?? '',
                    autoAvaliacao: null, 
                    descricaoNota: descricaoNotaText,
                    dadosFatosAutoAvaliacao: dadosFatosText,
                  },
                });
                results.created++;
                continue;
            }
            results.errors.push({ record: record as any, message: `Valor de score inválido para '${criterioNameFromSheet}': '${autoAvaliacaoScoreValue}'. Esperado um número entre 1 e 5 ou 'NA'.` } as any);
            continue;
        }
        
        // Criar o registro na nova tabela AutoAvaliacaoImportada
        await this.prisma.autoAvaliacaoImportada.create({
          data: {
            emailColaborador: userEmail, 
            ciclo: cycleIdentifier, 
            criterio: criterioNameFromSheet,
            descricaoGeral: descricaoGeralText ?? '',
            autoAvaliacao: autoAvaliacaoScore,
            descricaoNota: descricaoNotaText,
            dadosFatosAutoAvaliacao: dadosFatosText, 
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
  private async importAvaliacao360Importada(assessmentData: Assessment360Record[], userEmail: string, cycleIdentifier: string): Promise<any> {
    console.log('Iniciando importação de avaliações 360:', assessmentData.length);
    const results: { created: number; updated: number; errors: { record: any; message: string }[] } = { created: 0, updated: 0, errors: [] };

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

        // Criar o registro na nova tabela Avaliacao360Importada
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
  private async importPesquisaReferenciaImportada(feedbackData: ReferenceFeedbackRecord[], userEmail: string, cycleIdentifier: string): Promise<any> {
    console.log('Iniciando importação de feedbacks de referência:', feedbackData.length);
    const results: { created: number; updated: number; errors: { record: any; message: string }[] } = { created: 0, updated: 0, errors: [] }; 

    for (const record of feedbackData) {
      const emailReferencia = record['EMAIL DA REFERÊNCIA\n( nome.sobrenome )'];
      const justificativa = record.JUSTIFICATIVA;


      if (!emailReferencia || !justificativa) {
        results.errors.push({ record: record as any, message: 'Campos essenciais (EMAIL DA REFERÊNCIA, JUSTIFICATIVA) ausentes.' } as any);
        continue;
      }

      try {
        // Criar o registro na nova tabela PesquisaReferenciaImportada
        await this.prisma.pesquisaReferenciaImportada.create({
          data: {
            emailColaborador: userEmail, 
            ciclo: cycleIdentifier, 
            emailReferencia: emailReferencia,
            justificativa: justificativa,
          },
        });
        results.created++;

      } catch (error) {
        results.errors.push({ record: record as any, message: `Erro ao processar feedback de referência para '${userEmail}' referenciando '${emailReferencia}': ${error.message}` } as any);
      }
    }
    return results;
  }

  private generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}