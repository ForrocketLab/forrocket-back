/**
 * Utilitário para serializar datas corretamente na API
 */
export class DateSerializer {
  /**
   * Converte uma data para string ISO ou retorna null se inválida
   * @param date - Data a ser convertida
   * @returns String ISO ou null
   */
  static toISOString(date: Date | null | undefined): string | null {
    if (!date) return null;
    
    try {
      // Verificar se é uma instância de Date válida
      if (date instanceof Date && !isNaN(date.getTime())) {
        return date.toISOString();
      }
      
      // Se não for Date, tentar converter
      const converted = new Date(date as any);
      if (!isNaN(converted.getTime())) {
        return converted.toISOString();
      }
      
      return null;
    } catch (error) {
      console.warn('Erro ao serializar data:', date, error);
      return null;
    }
  }

  /**
   * Serializa um objeto convertendo todas as propriedades que são datas
   * @param obj - Objeto a ser serializado
   * @param dateFields - Lista de campos que são datas (suporta notação de ponto para campos aninhados)
   * @returns Objeto com datas serializadas
   */
  static serializeObject<T>(obj: T, dateFields: string[]): T {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const serialized = { ...obj };
    
    for (const field of dateFields) {
      if (field.includes('.')) {
        // Campo aninhado (ex: actions.deadline)
        const parts = field.split('.');
        const parentField = parts[0];
        const childField = parts[1];
        
        if (parentField in serialized && Array.isArray((serialized as any)[parentField])) {
          // Se é um array, serializar cada item
          (serialized as any)[parentField] = (serialized as any)[parentField].map((item: any) => {
            if (item && typeof item === 'object' && childField in item) {
              return {
                ...item,
                [childField]: this.toISOString(item[childField])
              };
            }
            return item;
          });
        } else if (parentField in serialized && (serialized as any)[parentField] && typeof (serialized as any)[parentField] === 'object') {
          // Se é um objeto único
          if (childField in (serialized as any)[parentField]) {
            (serialized as any)[parentField] = {
              ...(serialized as any)[parentField],
              [childField]: this.toISOString((serialized as any)[parentField][childField])
            };
          }
        }
      } else {
        // Campo simples
        if (field in serialized) {
          (serialized as any)[field] = this.toISOString((serialized as any)[field]);
        }
      }
    }

    return serialized;
  }

  /**
   * Serializa uma lista de objetos convertendo todas as propriedades que são datas
   * @param objects - Lista de objetos a serem serializados
   * @param dateFields - Lista de campos que são datas
   * @returns Lista com objetos serializados
   */
  static serializeArray<T>(objects: T[], dateFields: string[]): T[] {
    return objects.map(obj => this.serializeObject(obj, dateFields));
  }

  /**
   * Campos de data comuns em entidades
   */
  static readonly COMMON_DATE_FIELDS = ['createdAt', 'updatedAt', 'submittedAt'];
  
  /**
   * Campos de data específicos para ciclos de avaliação
   */
  static readonly CYCLE_DATE_FIELDS = [
    'startDate', 
    'endDate', 
    'assessmentDeadline', 
    'managerDeadline', 
    'equalizationDeadline',
    ...DateSerializer.COMMON_DATE_FIELDS
  ];
} 