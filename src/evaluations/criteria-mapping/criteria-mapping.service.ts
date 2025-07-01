import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as csvParser from 'csv-parser';
import { Readable } from 'stream';
import { join } from 'path';
import { readFileSync } from 'fs';
import * as XLSX from 'xlsx';
import { CriteriaMappingRecord } from './interfaces/criteria-mapping-record.interface';


@Injectable()
export class CriteriaMappingService implements OnModuleInit {
  private readonly logger = new Logger(CriteriaMappingService.name);
  private criteriaMap: Map<string, string> = new Map();

  async onModuleInit() {
    this.logger.log('Carregando mapeamento de critérios "de-para"...');
    await this.loadCriteriaMapping();
    this.logger.log(`Mapeamento de critérios carregado. Total de ${this.criteriaMap.size} entradas.`);
  }

  private async loadCriteriaMapping() {

    const filePath = join(process.cwd(), 'De-para de Critérios.xlsx'); 

    try {
      const fileBuffer = readFileSync(filePath);
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

      const sheetName = workbook.SheetNames.find(name => name === 'Planilha1' || name === 'Sheet1') || workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      if (!worksheet) {
          throw new Error(`Planilha '${sheetName}' não encontrada no arquivo 'De-para de Critérios.xlsx'. Planilhas disponíveis: ${workbook.SheetNames.join(', ')}`);
      }

      const records: CriteriaMappingRecord[] = XLSX.utils.sheet_to_json(worksheet);

      for (const record of records) {
        const oldCriterion = record['Critério Antigo']?.trim();
        const newCriterion = record['Critério Novo']?.trim();
        
        if (oldCriterion && newCriterion) {
          this.criteriaMap.set(oldCriterion, newCriterion);
        } else if (oldCriterion && !newCriterion) {
            this.logger.warn(`Critério Antigo '${oldCriterion}' sem Critério Novo correspondente na linha: ${JSON.stringify(record)}`);
        }
      }
    } catch (error) {
      this.logger.error(`Falha ao carregar o mapeamento de critérios de 'De-para de Critérios.xlsx': ${error.message}. Certifique-se de que o arquivo está no caminho correto e a planilha tem o formato esperado.`);
    }
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

  getNewCriterionName(oldCriterionName: string): string | undefined {
    return this.criteriaMap.get(oldCriterionName.trim());
  }
}