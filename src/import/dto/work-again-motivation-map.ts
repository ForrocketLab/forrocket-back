import { WorkAgainMotivation } from '@prisma/client';

const motivationMapping = new Map<string, WorkAgainMotivation>([
  ['Discordo Totalmente', WorkAgainMotivation.STRONGLY_DISAGREE],
  ['Discordo Parcialmente', WorkAgainMotivation.PARTIALLY_DISAGREE],
  ['Nem concordo, nem discordo', WorkAgainMotivation.NEUTRAL],
  ['Concordo Parcialmente', WorkAgainMotivation.PARTIALLY_AGREE],
  ['Concordo Totalmente', WorkAgainMotivation.STRONGLY_AGREE],
]);
