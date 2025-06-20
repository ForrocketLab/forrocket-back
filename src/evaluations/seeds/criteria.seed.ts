import { PrismaService } from '../../database/prisma.service';
import { CriterionPillar } from '@prisma/client';

interface CriterionSeedData {
  id: string;
  name: string;
  description: string;
  pillar: CriterionPillar;
  weight: number;
  isRequired: boolean;
}

const DEFAULT_CRITERIA: CriterionSeedData[] = [
  // PILAR: COMPORTAMENTO
  {
    id: 'sentimento-de-dono',
    name: 'Sentimento de Dono',
    description:
      'Demonstra responsabilidade pelos resultados, toma iniciativa e age como se fosse dono do negócio',
    pillar: CriterionPillar.BEHAVIOR,
    weight: 1.0,
    isRequired: true,
  },
  {
    id: 'resiliencia-adversidades',
    name: 'Resiliência nas Adversidades',
    description:
      'Mantém-se firme e positivo diante de desafios, adapta-se bem a mudanças e supera obstáculos',
    pillar: CriterionPillar.BEHAVIOR,
    weight: 1.0,
    isRequired: true,
  },
  {
    id: 'organizacao-trabalho',
    name: 'Organização no Trabalho',
    description:
      'Mantém organização pessoal, planeja bem as atividades e gerencia eficientemente o tempo',
    pillar: CriterionPillar.BEHAVIOR,
    weight: 1.0,
    isRequired: true,
  },
  {
    id: 'capacidade-aprender',
    name: 'Capacidade de Aprender',
    description:
      'Demonstra curiosidade, busca constantemente novos conhecimentos e aplica o que aprende',
    pillar: CriterionPillar.BEHAVIOR,
    weight: 1.0,
    isRequired: true,
  },
  {
    id: 'team-player',
    name: 'Ser "Team Player"',
    description:
      'Trabalha bem em equipe, colabora ativamente, compartilha conhecimento e ajuda colegas',
    pillar: CriterionPillar.BEHAVIOR,
    weight: 1.0,
    isRequired: true,
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
  },
  {
    id: 'atender-prazos',
    name: 'Atender aos Prazos',
    description:
      'Cumpre prazos estabelecidos, gerencia bem o tempo e comunica antecipadamente possíveis atrasos',
    pillar: CriterionPillar.EXECUTION,
    weight: 1.0,
    isRequired: true,
  },
  {
    id: 'fazer-mais-menos',
    name: 'Fazer Mais com Menos',
    description:
      'Otimiza recursos, encontra soluções eficientes e maximiza resultados com recursos limitados',
    pillar: CriterionPillar.EXECUTION,
    weight: 1.0,
    isRequired: true,
  },
  {
    id: 'pensar-fora-caixa',
    name: 'Pensar Fora da Caixa',
    description:
      'Demonstra criatividade, propõe soluções inovadoras e aborda problemas de forma não convencional',
    pillar: CriterionPillar.EXECUTION,
    weight: 1.0,
    isRequired: true,
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
  },
  {
    id: 'gestao-resultados',
    name: 'Resultados',
    description:
      'Foca na entrega de resultados, define metas claras e acompanha o desempenho da equipe',
    pillar: CriterionPillar.MANAGEMENT,
    weight: 1.0,
    isRequired: false, // Não obrigatório para todos os colaboradores
  },
  {
    id: 'evolucao-rocket',
    name: 'Evolução da Rocket Corp',
    description:
      'Contribui ativamente para o crescimento e evolução da empresa, propõe melhorias e inovações',
    pillar: CriterionPillar.MANAGEMENT,
    weight: 1.0,
    isRequired: true,
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
          updatedAt: new Date(),
        },
        create: {
          id: criterion.id,
          name: criterion.name,
          description: criterion.description,
          pillar: criterion.pillar,
          weight: criterion.weight,
          isRequired: criterion.isRequired,
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
