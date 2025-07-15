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
import { criteriaMap } from './dto/criteria-map';
import {
  CleanSelfAssessmentAnswer,
  Feedback360Data,
  ProfileData,
  ReferenceData,
  SelfAssessmentData,
} from './dto/import-dtos.dto';
import { motivationMapping } from './dto/work-again-motivation-map';

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
   * Processa um único arquivo Excel (.xls ou .xlsx)
   * @param file - Arquivo Excel enviado
   * @returns Resultado da importação
   */
  async processXslFile(file: Express.Multer.File, uploadedUser: User) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }

    // Validar formato do arquivo
    const allowedMimeTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Formato de arquivo não suportado. Apenas arquivos .xls e .xlsx são aceitos.',
      );
    }

    return this.processSingleFile(file, uploadedUser);
  }

  /**
   * Processa múltiplos arquivos Excel (.xls ou .xlsx)
   * @param files - Array de arquivos Excel enviados
   * @param uploadedUser - Usuário que está fazendo o upload
   * @returns Resultado da importação com detalhes de cada arquivo
   */
  async processMultipleXslFiles(files: Express.Multer.File[], uploadedUser: User) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }

    this.logger.log(`Iniciando processamento de ${files.length} arquivo(s)...`);

    const results = {
      totalFiles: files.length,
      successfulFiles: 0,
      failedFiles: 0,
      fileResults: [] as Array<{
        fileName: string;
        batchId: string;
        status: 'SUCCESS' | 'FAILED';
        message: string;
        userId?: string;
        userName?: string;
        error?: string;
      }>,
    };

    // Processar cada arquivo individualmente, criando um lote separado para cada um
    for (const file of files) {
      try {
        this.logger.log(`Processando arquivo: ${file.originalname}`);

        // Cada arquivo terá seu próprio lote individual
        const fileResult = await this.processSingleFile(file, uploadedUser);

        results.fileResults.push({
          fileName: file.originalname,
          batchId: fileResult.batchId,
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

        // Mesmo em caso de erro, vamos tentar criar um lote de falha para rastreabilidade
        let failedBatchId = 'N/A';
        try {
          const failedBatch = await this.prisma.importBatch.create({
            data: {
              fileName: file.originalname,
              status: 'FAILED',
              uploadedUserId: uploadedUser.id,
              notes: `Erro ao processar arquivo: ${errorMessage}`,
            } as Prisma.ImportBatchCreateInput,
          });
          failedBatchId = failedBatch.id;
        } catch (batchError) {
          this.logger.error(`Erro ao criar lote de falha para ${file.originalname}: ${batchError}`);
        }

        results.fileResults.push({
          fileName: file.originalname,
          batchId: failedBatchId,
          status: 'FAILED',
          message: `Falha ao processar arquivo`,
          error: errorMessage,
        });

        results.failedFiles++;
        this.logger.error(`❌ Erro ao processar arquivo ${file.originalname}: ${errorMessage}`);
      }
    }

    this.logger.log(
      `Processamento concluído: ${results.successfulFiles}/${results.totalFiles} arquivos processados com sucesso`,
    );

    return {
      message: `Processamento concluído: ${results.successfulFiles}/${results.totalFiles} arquivos processados com sucesso`,
      ...results,
    };
  }

  /**
   * Processa um único arquivo (usado tanto para arquivo único quanto para cada arquivo em um lote)
   * @param file - Arquivo Excel
   * @param uploadedUser - Usuário que fez o upload (para arquivos únicos)
   * @param existingBatchId - ID de lote existente (para arquivos em lote múltiplo)
   * @returns Resultado da importação
   */
  private async processSingleFile(
    file: Express.Multer.File,
    uploadedUser?: User,
    existingBatchId?: string,
  ) {
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
    const referenceData: ReferenceData[] = xlsx.utils.sheet_to_json(
      workbook.Sheets['Pesquisa de Referências'],
    );

    // --- PARTE 2: EXECUTAR A LÓGICA DE BANCO DE DADOS ---

    // 1. Criar ou usar lote existente
    const batch = existingBatchId
      ? await this.prisma.importBatch.findUnique({ where: { id: existingBatchId } })
      : await this.prisma.importBatch.create({
          data: {
            fileName: file.originalname,
            status: 'PROCESSING',
            uploadedUserId: uploadedUser?.id,
          } as Prisma.ImportBatchCreateInput,
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

        await this.processReferences(tx, referenceData, user.id, userCycle, batch.id);
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
        businessHub: mainProfile['Unidade'],
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
      // PROCESSAR NOVOS CAMPOS (PERÍODO E MOTIVAÇÃO)
      // =================================================================
      const periodWorked = row['PERÍODO'];
      const motivationText =
        row['VOCÊ FICARIA MOTIVADO EM TRABALHAR NOVAMENTE COM ESTE COLABORADOR'];

      // Processar o período - converter para string se necessário
      let periodWorkedStr: string | null = null;
      if (periodWorked !== undefined && periodWorked !== null) {
        periodWorkedStr =
          typeof periodWorked === 'string' ? periodWorked.trim() : String(periodWorked);
      }

      // Mapear a motivação usando o mapeamento definido
      let motivationToWorkAgain: import('@prisma/client').WorkAgainMotivation | undefined;
      if (motivationText && typeof motivationText === 'string') {
        motivationToWorkAgain = motivationMapping.get(motivationText.trim());
        if (!motivationToWorkAgain) {
          this.logger.warn(
            `Valor de motivação não reconhecido: "${motivationText}" para o avaliado "${evaluatedUserEmail}". Será definido como null.`,
          );
        }
      }

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
          periodWorked: periodWorkedStr,
          motivationToWorkAgain: motivationToWorkAgain || null,
          status: 'SUBMITTED',
          importBatchId: batchId,
        },
        update: {
          overallScore,
          strengths: strengthsText,
          improvements: improvementsText,
          periodWorked: periodWorkedStr,
          motivationToWorkAgain: motivationToWorkAgain || null,
          importBatchId: batchId,
        },
      });
    }

    this.logger.log('Processamento de feedbacks 360 concluído.');
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
    authorId: string, // Este é o usuário principal da importação
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
      const referencedEmailPrefix = row['EMAIL DA REFERÊNCIA\n( nome.sobrenome )']?.toLowerCase();

      if (!referencedEmailPrefix) {
        this.logger.warn('Linha de referência sem email do autor. Pulando.');
        continue;
      }

      // Constrói o email completo.
      // Assumindo que o domínio padrão é @example.com, como em outras funções.
      const referencedEmail = `${referencedEmailPrefix}@example.com`;

      // 1. Encontra ou cria o usuário AUTOR da referência.
      const referencedUser = await this.findOrCreateUser(
        tx,
        { email: referencedEmail }, // Passamos apenas o email. O nome será gerado se o usuário for novo.
        batchId,
      );

      const justification = row['JUSTIFICATIVA'];
      if (!justification) {
        this.logger.warn(`Justificativa vazia para a referência de "${referencedEmail}". Pulando.`);
        continue;
      }

      // 2. Usa 'upsert' para criar ou atualizar o feedback de referência.
      // A chave única previne que a mesma pessoa dê a mesma referência no mesmo ciclo mais de uma vez.
      await tx.referenceFeedback.upsert({
        where: {
          authorId_referencedUserId_cycle: {
            authorId: authorId,
            referencedUserId: referencedUser.id,
            cycle: cycle,
          },
        },
        create: {
          authorId: authorId,
          referencedUserId: referencedUser.id,
          cycle,
          justification,
          status: 'SUBMITTED',
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
    details: { email: string; name?: string; businessHub?: string },
    batchId: string,
  ): Promise<User> {
    const { email, name, businessHub } = details;

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
        businessHub: businessHub, // Atualiza se fornecido
      },
      create: {
        email,
        name: finalName,
        businessHub: businessHub || 'A ser definido',
        passwordHash: await bcrypt.hash('password123', 10), // Senha padrão segura
        roles: JSON.stringify(['colaborador']),
        jobTitle: 'A ser definido',
        seniority: 'A ser definido',
        careerTrack: 'A ser definido',
        businessUnit: 'A ser definido',
        isActive: false, // Começa inativo
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
        this.logger.log(
          `Usuário ${authorId} identificado como gestor (${criteriaWithValidScores.length}/${managementCriteriaWithScores.length} critérios válidos). Atualizando roles...`,
        );

        // Adiciona MANAGER se não existir
        if (!currentRoles.includes('gestor')) {
          currentRoles.push('gestor');
        }

        this.logger.log(
          `Usuário ${authorId} será atualizado para MANAGER apenas (sem COLLABORATOR).`,
        );
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
          role: 'COLLABORATOR',
        },
      });

      // Remove a role de COLLABORATOR de TODOS os projetos onde o usuário está
      const userProjects = await tx.userProjectRole.findMany({
        where: {
          userId: authorId,
          role: 'COLLABORATOR',
        },
        select: { projectId: true },
      });

      if (userProjects.length > 0) {
        await tx.userProjectRole.deleteMany({
          where: {
            userId: authorId,
            role: 'COLLABORATOR',
          },
        });

        // Adiciona a role de MANAGER nos projetos onde era COLLABORATOR
        const managerRolePromises = userProjects.map((project) =>
          tx.userProjectRole.upsert({
            where: {
              userId_projectId_role: {
                userId: authorId,
                projectId: project.projectId,
                role: 'MANAGER',
              },
            },
            create: {
              userId: authorId,
              projectId: project.projectId,
              role: 'MANAGER',
            },
            update: {},
          }),
        );

        await Promise.all(managerRolePromises);

        this.logger.log(
          `Roles de COLLABORATOR removidas e substituídas por MANAGER em ${userProjects.length} projeto(s) para o usuário ${authorId}.`,
        );
      }

      this.logger.log(
        `UserRoleAssignment criado/atualizado: ${authorId} como MANAGER (COLLABORATOR removido).`,
      );
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

  // ==========================================
  // MÉTODOS PARA CONSULTA DE LOTES DE IMPORTAÇÃO
  // ==========================================

  /**
   * Lista todos os lotes de importação de um usuário específico
   * @param userId - ID do usuário que fez os uploads
   * @returns Lista de lotes ordenados por data de importação (mais recente primeira)
   */
  async getImportBatchesByUser(userId: string) {
    const batches = await this.prisma.importBatch.findMany({
      where: { uploadedUserId: userId },
      orderBy: { importedAt: 'desc' },
      include: {
        uploadedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            createdUsers: true,
            createdSelfAssessments: true,
            createdAssessments360: true,
            createdReferenceFeedbacks: true,
          },
        },
      },
    });
    return batches.map(batch => ({
      ...batch,
      importedAt: batch.importedAt instanceof Date ? batch.importedAt.toISOString() : batch.importedAt,
    }));
  }

  /**
   * Lista os lotes de importação de um usuário específico com paginação
   * @param userId - ID do usuário que fez os uploads
   * @param page - Número da página (começando em 1)
   * @param limit - Número de itens por página
   * @param sortBy - Campo para ordenação
   * @param sortOrder - Ordem da ordenação (asc ou desc)
   * @returns Dados paginados com metadados
   */
  async getImportBatchesByUserPaginated(
    userId: string,
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'importedAt',
    sortOrder: 'asc' | 'desc' = 'desc',
  ) {
    // Calcular offset
    const skip = (page - 1) * limit;

    // Validar e mapear campo de ordenação
    const allowedSortFields = ['importedAt', 'fileName', 'status'];
    const orderByField = allowedSortFields.includes(sortBy) ? sortBy : 'importedAt';

    // Executar consultas em paralelo para performance
    const [data, total] = await Promise.all([
      this.prisma.importBatch.findMany({
        where: { uploadedUserId: userId },
        orderBy: { [orderByField]: sortOrder },
        skip,
        take: limit,
        include: {
          uploadedUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              createdUsers: true,
              createdSelfAssessments: true,
              createdAssessments360: true,
              createdReferenceFeedbacks: true,
            },
          },
        },
      }),
      this.prisma.importBatch.count({
        where: { uploadedUserId: userId },
      }),
    ]);

    // Serializar importedAt
    const fixedData = data.map(batch => ({
      ...batch,
      importedAt: batch.importedAt instanceof Date ? batch.importedAt.toISOString() : batch.importedAt,
    }));

    // Calcular metadados da paginação
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrevious = page > 1;

    return {
      data: fixedData,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrevious,
      },
    };
  }

  /**
   * Lista todos os lotes de importação do sistema (para admins/RH)
   * @returns Lista de todos os lotes ordenados por data de importação (mais recente primeira)
   */
  async getAllImportBatches() {
    const batches = await this.prisma.importBatch.findMany({
      orderBy: { importedAt: 'desc' },
      include: {
        uploadedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            createdUsers: true,
            createdSelfAssessments: true,
            createdAssessments360: true,
            createdReferenceFeedbacks: true,
          },
        },
      },
    });
    return batches.map(batch => ({
      ...batch,
      importedAt: batch.importedAt instanceof Date ? batch.importedAt.toISOString() : batch.importedAt,
    }));
  }

  /**
   * Obtém detalhes completos de um lote específico
   * @param batchId - ID do lote
   * @returns Detalhes completos do lote incluindo dados relacionados
   */
  async getImportBatchDetails(batchId: string) {
    const batch = await this.prisma.importBatch.findUnique({
      where: { id: batchId },
      include: {
        uploadedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdUsers: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
        createdSelfAssessments: {
          select: {
            id: true,
            cycle: true,
            status: true,
            createdAt: true,
            author: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        createdAssessments360: {
          select: {
            id: true,
            cycle: true,
            overallScore: true,
            status: true,
            createdAt: true,
            author: {
              select: {
                name: true,
                email: true,
              },
            },
            evaluatedUser: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        createdReferenceFeedbacks: {
          select: {
            id: true,
            cycle: true,
            status: true,
            createdAt: true,
            author: {
              select: {
                name: true,
                email: true,
              },
            },
            referencedUser: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!batch) {
      throw new BadRequestException(`Lote de importação com ID '${batchId}' não encontrado.`);
    }

    return batch;
  }

  /**
   * Remove um lote de importação e todos os dados associados
   * @param batchId - ID do lote a ser removido
   * @param userId - ID do usuário que está solicitando a remoção (para verificação de permissão)
   */
  async deleteImportBatch(batchId: string, userId: string) {
    // Verificar se o lote existe e se o usuário tem permissão
    const batch = await this.prisma.importBatch.findUnique({
      where: { id: batchId },
      include: {
        uploadedUser: {
          select: { id: true },
        },
      },
    });

    if (!batch) {
      throw new BadRequestException(`Lote de importação com ID '${batchId}' não encontrado.`);
    }

    // Verificar se é o próprio usuário que fez o upload ou se é admin/RH
    // (Nota: aqui você pode adicionar lógica adicional para verificar roles de admin/RH)
    if (batch.uploadedUserId !== userId) {
      throw new BadRequestException('Você não tem permissão para excluir este lote de importação.');
    }

    // Deletar o lote (Prisma irá automaticamente deletar dados relacionados devido ao onDelete: Cascade)
    await this.prisma.importBatch.delete({
      where: { id: batchId },
    });

    this.logger.log(`Lote de importação ${batchId} removido com sucesso por usuário ${userId}`);
  }
}
