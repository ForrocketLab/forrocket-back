import { PrismaService } from '../../database/prisma.service';
import { BusinessUnit } from '../../common/enums/business-unit.enum';

const CriterionPillar = {
  BEHAVIOR: 'BEHAVIOR' as const,
  EXECUTION: 'EXECUTION' as const,
  MANAGEMENT: 'MANAGEMENT' as const,
} as const;

interface CriterionSeedData {
  id: string;
  name: string;
  description: string;
  pillar: typeof CriterionPillar[keyof typeof CriterionPillar];
  weight: number;
  isRequired: boolean;
  businessUnit?: string;
  isBase?: boolean;
}

const DEFAULT_CRITERIA: CriterionSeedData[] = [
  // BASE (isBase: true, businessUnit: null)
  {
    id: 'sentimento-de-dono',
    name: 'Sentimento de Dono',
    description:
      'Demonstra responsabilidade pelos resultados, toma iniciativa e age como se fosse dono do negócio',
    pillar: CriterionPillar.BEHAVIOR,
    weight: 1.0,
    isRequired: true,
    businessUnit: undefined,
    isBase: true,
  },
  {
    id: 'resiliencia-adversidades',
    name: 'Resiliência nas Adversidades',
    description:
      'Mantém-se firme e positivo diante de desafios, adapta-se bem a mudanças e supera obstáculos',
    pillar: CriterionPillar.BEHAVIOR,
    weight: 1.0,
    isRequired: true,
    businessUnit: undefined,
    isBase: true,
  },
  {
    id: 'organizacao-trabalho',
    name: 'Organização no Trabalho',
    description:
      'Mantém organização pessoal, planeja bem as atividades e gerencia eficientemente o tempo',
    pillar: CriterionPillar.BEHAVIOR,
    weight: 1.0,
    isRequired: true,
    businessUnit: undefined,
    isBase: true,
  },
  {
    id: 'capacidade-aprender',
    name: 'Capacidade de Aprender',
    description:
      'Demonstra curiosidade, busca constantemente novos conhecimentos e aplica o que aprende',
    pillar: CriterionPillar.BEHAVIOR,
    weight: 1.0,
    isRequired: true,
    businessUnit: undefined,
    isBase: true,
  },
  {
    id: 'team-player',
    name: 'Ser "Team Player"',
    description:
      'Trabalha bem em equipe, colabora ativamente, compartilha conhecimento e ajuda colegas',
    pillar: CriterionPillar.BEHAVIOR,
    weight: 1.0,
    isRequired: true,
    businessUnit: undefined,
    isBase: true,
  },

  // PILAR: EXECUÇÃO
  {
    id: 'entregar-qualidade',
    name: 'Entregar com Qualidade',
    description:
      'Entrega trabalhos com alta qualidade, atenção aos detalhes e seguindo padrões estabelecidos',
    pillar: CriterionPillar.EXECUTION,
    weight: 1.0,
    isRequired: true,
    businessUnit: undefined,
    isBase: true,
  },
  {
    id: 'atender-prazos',
    name: 'Atender aos Prazos',
    description:
      'Cumpre prazos estabelecidos, gerencia bem o tempo e comunica antecipadamente possíveis atrasos',
    pillar: CriterionPillar.EXECUTION,
    weight: 1.0,
    isRequired: true,
    businessUnit: undefined,
    isBase: true,
  },
  {
    id: 'fazer-mais-menos',
    name: 'Fazer Mais com Menos',
    description:
      'Otimiza recursos, encontra soluções eficientes e maximiza resultados com recursos limitados',
    pillar: CriterionPillar.EXECUTION,
    weight: 1.0,
    isRequired: true,
    businessUnit: undefined,
    isBase: true,
  },
  {
    id: 'pensar-fora-caixa',
    name: 'Pensar Fora da Caixa',
    description:
      'Demonstra criatividade, propõe soluções inovadoras e aborda problemas de forma não convencional',
    pillar: CriterionPillar.EXECUTION,
    weight: 1.0,
    isRequired: true,
    businessUnit: undefined,
    isBase: true,
  },

  // PILAR: GESTÃO E LIDERANÇA
  {
    id: 'gestao-gente',
    name: 'Gente',
    description:
      'Desenvolve pessoas, inspira e motiva a equipe, promove um ambiente colaborativo e de crescimento',
    pillar: CriterionPillar.MANAGEMENT,
    weight: 1.0,
    isRequired: false, // Não obrigatório para todos os colaboradores
    businessUnit: undefined,
    isBase: true,
  },
  {
    id: 'gestao-resultados',
    name: 'Resultados',
    description:
      'Foca na entrega de resultados, define metas claras e acompanha o desempenho da equipe',
    pillar: CriterionPillar.MANAGEMENT,
    weight: 1.0,
    isRequired: false, // Não obrigatório para todos os colaboradores
    businessUnit: undefined,
    isBase: true,
  },
  {
    id: 'evolucao-rocket',
    name: 'Evolução da Rocket Corp',
    description:
      'Contribui ativamente para o crescimento e evolução da empresa, propõe melhorias e inovações',
    pillar: CriterionPillar.MANAGEMENT,
    weight: 1.0,
    isRequired: true,
    businessUnit: undefined,
    isBase: true,
  },

  // CRITÉRIOS ESPECÍFICOS DIGITAL PRODUCTS
  {
    id: 'inovacao-tecnologica',
    name: 'Inovação Tecnológica',
    description:
      'Demonstra capacidade de propor e implementar soluções tecnológicas inovadoras que agregam valor ao produto',
    pillar: CriterionPillar.EXECUTION,
    weight: 1.0,
    isRequired: false,
    businessUnit: BusinessUnit.DIGITAL_PRODUCTS,
    isBase: false,
  },
  {
    id: 'user-experience',
    name: 'Foco na Experiência do Usuário',
    description:
      'Prioriza a experiência do usuário final nas decisões técnicas e de produto',
    pillar: CriterionPillar.EXECUTION,
    weight: 1.0,
    isRequired: false,
    businessUnit: BusinessUnit.DIGITAL_PRODUCTS,
    isBase: false,
  },
  {
    id: 'agilidade-entrega',
    name: 'Agilidade na Entrega',
    description:
      'Demonstra capacidade de entregar valor rapidamente através de metodologias ágeis e MVP',
    pillar: CriterionPillar.EXECUTION,
    weight: 1.0,
    isRequired: false,
    businessUnit: BusinessUnit.DIGITAL_PRODUCTS,
    isBase: false,
  },

  // CRITÉRIOS ESPECÍFICOS OPERATIONS
  {
    id: 'eficiencia-operacional',
    name: 'Eficiência Operacional',
    description:
      'Busca constantemente otimizar processos operacionais e reduzir custos mantendo a qualidade',
    pillar: CriterionPillar.EXECUTION,
    weight: 1.0,
    isRequired: false,
    businessUnit: BusinessUnit.OPERATIONS,
    isBase: false,
  },
  {
    id: 'compliance-processos',
    name: 'Compliance e Processos',
    description:
      'Garante aderência aos processos estabelecidos e regulamentações aplicáveis',
    pillar: CriterionPillar.EXECUTION,
    weight: 1.0,
    isRequired: false,
    businessUnit: BusinessUnit.OPERATIONS,
    isBase: false,
  },
  {
    id: 'gestao-risco',
    name: 'Gestão de Risco',
    description:
      'Identifica, avalia e mitiga riscos operacionais de forma proativa',
    pillar: CriterionPillar.MANAGEMENT,
    weight: 1.0,
    isRequired: false,
    businessUnit: BusinessUnit.OPERATIONS,
    isBase: false,
  },
];

export async function seedCriteria(prisma: PrismaService): Promise<void> {
  console.log('🌱 Iniciando seed dos critérios de avaliação...');

  for (const criterion of DEFAULT_CRITERIA) {
    try {
      await prisma.criterion.upsert({
        where: { id: criterion.id },
        update: {
          name: criterion.name,
          description: criterion.description,
          pillar: criterion.pillar,
          weight: criterion.weight,
          isRequired: criterion.isRequired,
          businessUnit: criterion.businessUnit || null,
          isBase: criterion.isBase || false,
          updatedAt: new Date(),
        },
        create: {
          id: criterion.id,
          name: criterion.name,
          description: criterion.description,
          pillar: criterion.pillar,
          weight: criterion.weight,
          isRequired: criterion.isRequired,
          businessUnit: criterion.businessUnit || null,
          isBase: criterion.isBase || false,
        },
      });

      console.log(`✅ Critério "${criterion.name}" inserido/atualizado com sucesso`);
    } catch (error) {
      console.error(`❌ Erro ao inserir critério "${criterion.name}":`, error);
    }
  }

  console.log('🎉 Seed dos critérios concluído!');
}

export { DEFAULT_CRITERIA };
