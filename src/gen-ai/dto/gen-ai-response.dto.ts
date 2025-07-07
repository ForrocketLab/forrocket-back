export class BrutalFactsDto {
  facts: string;
}

// Estes DTOs representam a estrutura COMPLETA da resposta da API da OpenAI.
class OpenAiMessageDto {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

class OpenAiChoiceDto {
  index: number;
  message: OpenAiMessageDto;
  finish_reason: string;
}

export class OpenAiChatCompletionResponseDto {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: OpenAiChoiceDto[];
  // Inclua outros campos se precisar, como 'usage'.
}
