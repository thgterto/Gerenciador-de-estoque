
import { RiskFlags } from '../types';
import { normalizeStr, calculateSimilarity, cleanHeader, normalizeUnit, tokenizeHeader } from './stringUtils';
import * as XLSX from 'xlsx';

export type ImportMode = 'MASTER' | 'HISTORY';

export interface ColumnDefinition {
  key: string;
  label: string;
  required: boolean;
  regex: RegExp[];
  type: 'string' | 'number' | 'date' | 'risks' | 'boolean';
  validator?: (value: any) => boolean; // Validates parsed value
  errorMessage?: string;
}

export interface DetectedTable {
    id: string;
    rowIndex: number; // Linha onde começa o cabeçalho (0-based)
    confidence: number;
    preview: string[]; // Headers encontrados
    rowCountEstimate: number;
}

// Helper Parsers
const parseExcelDate = (value: any): string | null => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') {
    if (value < 1000) return null; 
    const utc_days = Math.floor(value - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    const offset = date_info.getTimezoneOffset() * 60 * 1000;
    const adjustedDate = new Date(date_info.getTime() + offset);
    if (isNaN(adjustedDate.getTime()) || adjustedDate.getFullYear() < 1990) return null;
    return adjustedDate.toISOString().split('T')[0];
  }
  const str = String(value).trim();
  // Formato Brasileiro (DD/MM/AAAA)
  const ptBrMatch = str.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/);
  if (ptBrMatch) {
      const day = parseInt(ptBrMatch[1], 10);
      const month = parseInt(ptBrMatch[2], 10);
      const year = parseInt(ptBrMatch[3], 10);
      const dt = new Date(year, month - 1, day);
      if (!isNaN(dt.getTime())) return dt.toISOString().split('T')[0];
  }
  // Formato ISO
  const isoMatch = str.match(/^(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})/);
  if (isoMatch) {
      const dt = new Date(str);
      if (!isNaN(dt.getTime())) return dt.toISOString().split('T')[0];
  }
  return null;
};

const parseExcelNumber = (value: any): number | null => {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number') return isNaN(value) ? null : value;
    let str = String(value).trim().replace(/[R$€£\s]/g, '');
    const lastComma = str.lastIndexOf(',');
    const lastDot = str.lastIndexOf('.');
    if (lastComma > lastDot) str = str.replace(/\./g, '').replace(',', '.');
    else if (lastDot > -1) str = str.replace(/,/g, '');
    const num = parseFloat(str);
    return isNaN(num) ? null : num;
};

// Schema Robusto para Inventário Mestre (Produtos/Saldos)
const MASTER_SCHEMA: ColumnDefinition[] = [
  { key: 'name', label: 'Produto / Descrição', required: true, regex: [/nome/i, /produto/i, /descricao/i, /material/i, /item/i, /desc\./i, /denominacao/i, /nome_produto/i, /description/i], type: 'string' },
  { key: 'sapCode', label: 'Código SAP / SKU', required: false, regex: [/sap/i, /sku/i, /cod/i, /artigo/i, /part.*number/i, /ref/i, /^cdsap$/i, /cod_sap/i, /^id$/i], type: 'string' },
  { key: 'casNumber', label: 'CAS Number', required: false, regex: [/cas/i, /registro.*quimico/i, /chemical/i, /cas_no/i], type: 'string' },
  { key: 'lotNumber', label: 'Lote / Série', required: false, regex: [/^lote$/i, /batch/i, /serie/i, /lot/i, /n_lote/i, /control/i], type: 'string' },
  { key: 'expiryDate', label: 'Validade', required: false, regex: [/val/i, /venc/i, /exp/i, /shelf/i, /validade/i, /data.*val/i, /dt_validade/i, /vencimento/i], type: 'date' },
  { 
      key: 'quantity', 
      label: 'Quantidade / Saldo', 
      required: false, 
      regex: [/qtd/i, /quant/i, /saldo/i, /estoque/i, /atual/i, /total/i, /quantidade/i, /amount/i, /on_hand/i], 
      type: 'number',
      validator: (v) => typeof v === 'number' && v >= 0,
      errorMessage: 'Quantidade não pode ser negativa'
  },
  { key: 'baseUnit', label: 'Unidade (UN/L/Kg)', required: false, regex: [/un/i, /medida/i, /emb/i, /unit/i, /u\.m/i, /unidade/i, /uom/i], type: 'string' },
  { 
      key: 'minStockLevel', 
      label: 'Estoque Mínimo', 
      required: false, 
      regex: [/min/i, /alerta/i, /ponto.*repo/i, /seguranca/i, /reorder/i], 
      type: 'number',
      validator: (v) => typeof v === 'number' && v >= 0,
      errorMessage: 'Estoque mínimo deve ser positivo'
  },
  { key: 'category', label: 'Categoria / Grupo', required: false, regex: [/cat/i, /grupo/i, /tipo/i, /fam/i, /classe/i, /class/i], type: 'string' },
  { key: 'supplier', label: 'Fabricante / Fornecedor', required: false, regex: [/fabr/i, /forn/i, /marca/i, /brand/i, /manuf/i, /vendor/i, /fabricante/i, /fornecedor/i], type: 'string' },
  { key: 'warehouse', label: 'Local (Armazém/Sala)', required: false, regex: [/local/i, /armazem/i, /sala/i, /almox/i, /deposito/i, /setor/i, /warehouse/i, /dep/i], type: 'string' },
  { key: 'cabinet', label: 'Armário / Geladeira', required: false, regex: [/armario/i, /geladeira/i, /freezer/i, /bancada/i, /gaveta/i, /cabinet/i, /storage/i], type: 'string' },
  { key: 'risks', label: 'Riscos (GHS/Texto)', required: false, regex: [/risc/i, /ghs/i, /perig/i, /seguranca/i, /msds/i, /class.*risco/i, /hazard/i], type: 'risks' },
];

const HISTORY_SCHEMA: ColumnDefinition[] = [
  { key: 'date', label: 'Data Movimento', required: true, regex: [/data/i, /date/i, /dia/i, /hora/i, /dt\./i, /emissao/i, /data_mov/i, /dt_mov/i, /movimentacao/i], type: 'date' },
  { key: 'type', label: 'Tipo (Entrada/Saída)', required: true, regex: [/tipo/i, /oper/i, /mov/i, /natureza/i, /transacao/i, /action/i, /tipo_mov/i, /tp_mov/i, /operation/i], type: 'string' },
  { key: 'productName', label: 'Produto', required: false, regex: [/nome/i, /prod/i, /desc/i, /material/i, /item/i, /nm_produto/i], type: 'string' },
  { key: 'sapCode', label: 'Código SAP', required: false, regex: [/sap/i, /cod/i, /sku/i, /artigo/i, /^cdsap$/i, /cod_sap/i], type: 'string' },
  { key: 'lotNumber', label: 'Lote', required: false, regex: [/^lote$/i, /batch/i, /serie/i, /n_lote/i], type: 'string' },
  { 
      key: 'quantity', 
      label: 'Quantidade', 
      required: true, 
      regex: [/qtd/i, /quant/i, /volume/i, /montante/i, /quantidade/i, /qt_mov/i], 
      type: 'number',
      validator: (v) => typeof v === 'number' && v > 0,
      errorMessage: 'Quantidade deve ser maior que zero'
  },
  { key: 'unit', label: 'Unidade', required: false, regex: [/unid/i, /medida/i, /unit/i, /unidade/i], type: 'string' },
  { key: 'observation', label: 'Observação / Motivo', required: false, regex: [/obs/i, /motivo/i, /justif/i, /nota/i, /hist/i, /historico/i, /ds_obs/i], type: 'string' },
  { key: 'supplier', label: 'Fornecedor / Origem', required: false, regex: [/forn/i, /origem/i, /destino/i, /fabr/i], type: 'string' },
  { key: 'warehouse', label: 'Local', required: false, regex: [/local/i, /armazem/i, /deposito/i], type: 'string' }
];

// --- ANÁLISE DE CONTEÚDO (DATA SNIFFING) ---
const sniffColumnType = (header: string, sampleData: any[]): { isDate: number, isNumber: number, isText: number } => {
    let validDates = 0;
    let validNumbers = 0;
    let totalSamples = 0;

    const samples = sampleData.slice(0, 50).map(row => row[header]).filter(v => v !== undefined && v !== null && String(v).trim() !== '');
    
    if (samples.length === 0) return { isDate: 0, isNumber: 0, isText: 0 };

    samples.forEach(val => {
        totalSamples++;
        if (parseExcelNumber(val) !== null) validNumbers++;
        if (parseExcelDate(val) !== null) {
            validDates += (typeof val === 'number') ? 0.6 : 1.0; 
        }
    });

    return {
        isDate: validDates / totalSamples,
        isNumber: validNumbers / totalSamples,
        isText: 1.0 
    };
};

export const ImportEngine = {
  getSchema(mode: ImportMode) {
    return mode === 'MASTER' ? MASTER_SCHEMA : HISTORY_SCHEMA;
  },

  detectDataTables(worksheet: XLSX.WorkSheet, mode: ImportMode): DetectedTable[] {
     const schema = this.getSchema(mode);
     const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
     const candidates: DetectedTable[] = [];
     const scanLimit = Math.min(rawRows.length, 100); 

     for (let i = 0; i < scanLimit; i++) {
         const row = rawRows[i];
         if (!Array.isArray(row) || row.length === 0) continue;

         let matchScore = 0;
         let validColumns = 0;
         const rowPreview: string[] = [];

         row.forEach(cell => {
             const cellVal = String(cell || '').trim();
             if (!cellVal) return;
             rowPreview.push(cellVal);
             const cellNorm = normalizeStr(cellVal);
             const cellClean = cleanHeader(cellVal);
             
             let hasMatch = false;
             schema.forEach(field => {
                 if (field.regex.some(r => r.test(cellNorm) || r.test(cellClean))) {
                     matchScore += 20;
                     hasMatch = true;
                 } else {
                     const simLabel = calculateSimilarity(cellVal, field.label);
                     const simKey = calculateSimilarity(cellClean, field.key);
                     if (Math.max(simLabel, simKey) > 0.85) {
                         matchScore += 15;
                         hasMatch = true;
                     }
                 }
             });
             if (hasMatch) validColumns++;
         });

         if (validColumns >= 2 && matchScore >= 30) {
             let dataRowsCount = 0;
             for (let j = 1; j <= 5; j++) {
                 const nextRow = rawRows[i + j];
                 if (nextRow && Array.isArray(nextRow) && nextRow.length > 0) {
                     dataRowsCount++;
                 }
             }
             if (dataRowsCount >= 1) {
                 candidates.push({
                     id: `table-row-${i}`,
                     rowIndex: i,
                     confidence: Math.min(100, matchScore + (validColumns * 5)),
                     preview: rowPreview.slice(0, 6),
                     rowCountEstimate: rawRows.length - i - 1
                 });
             }
         }
     }
     return candidates.sort((a, b) => b.confidence - a.confidence);
  },

  /**
   * Mapeamento Inteligente com Validação de Regras de Negócio
   */
  suggestMapping(headers: string[], sampleData: any[], mode: ImportMode): Record<string, { col: string, confidence: number }> {
    const schema = this.getSchema(mode);
    const mapping: Record<string, { col: string, confidence: number }> = {};
    const usedHeaders = new Set<string>();

    // Pré-calcula os tipos de dados de cada coluna (Header -> TypeProbabilities)
    const columnStats: Record<string, { isDate: number, isNumber: number, isText: number }> = {};
    headers.forEach(h => {
        if (h) columnStats[h] = sniffColumnType(h, sampleData);
    });

    const sortedSchema = [...schema].sort((a, b) => (a.required === b.required ? 0 : a.required ? -1 : 1));

    sortedSchema.forEach(field => {
      let bestMatch = '';
      let bestScore = 0;

      headers.forEach(header => {
        if (!header || usedHeaders.has(header)) return;
        
        let score = 0;
        const normHeader = normalizeStr(header);
        const cleanedHeader = cleanHeader(header);
        const tokens = tokenizeHeader(header);
        const fieldTokens = tokenizeHeader(field.label);

        // 1. Text Similarity (Nome)
        if (field.regex.some(r => r.test(normHeader) || r.test(cleanedHeader))) {
            score = 90;
        } else if (normHeader === normalizeStr(field.key) || normHeader === normalizeStr(field.label)) {
            score = 100;
        } else {
            const overlap = tokens.filter(t => fieldTokens.includes(t)).length;
            if (overlap > 0) {
                score = 70 + (overlap * 10);
            } else {
                const simKey = calculateSimilarity(cleanedHeader, field.key);
                const simLabel = calculateSimilarity(header, field.label);
                score = Math.max(simKey, simLabel) * 60; 
            }
        }

        // 2. Data Type Compatibility
        const stats = columnStats[header];
        if (stats) {
            if (field.type === 'date') {
                if (stats.isDate > 0.5) score += 20; 
                else if (stats.isNumber < 0.1 && stats.isText > 0.9) score -= 30; 
            }
            if (field.type === 'number') {
                if (stats.isNumber > 0.7) score += 15;
                else if (stats.isNumber < 0.1) score -= 50; 
            }
        }

        // 3. Business Rule Validation (Validador do Schema)
        if (field.validator && score > 40) { // Check only if it's a decent candidate
            const samples = sampleData.slice(0, 20).map(r => r[header]);
            let validSamples = 0;
            let rulePasses = 0;

            samples.forEach(v => {
                let parsed: any = v;
                if (field.type === 'number') parsed = parseExcelNumber(v);
                if (field.type === 'date') parsed = parseExcelDate(v);
                
                if (parsed !== null && parsed !== undefined && parsed !== '') {
                    validSamples++;
                    if (field.validator!(parsed)) {
                        rulePasses++;
                    }
                }
            });

            if (validSamples > 0) {
                const passRate = rulePasses / validSamples;
                if (passRate < 0.9) { 
                    score -= 50; // Penalize heavily if data violates business rules (e.g. negative quantity)
                } else {
                    score += 10; // Bonus for adhering to business rules
                }
            }
        }

        // 4. Specific Ambiguities
        if (field.key === 'quantity' && (normHeader.includes('min') || normHeader.includes('critico'))) {
            score -= 40;
        }
        if (field.key === 'lotNumber' && normHeader.includes('id') && score > 0) {
            score -= 20; 
        }

        if (score > bestScore) {
          bestScore = score;
          bestMatch = header;
        }
      });

      if (bestScore >= 60 && !usedHeaders.has(bestMatch)) {
        mapping[field.key] = { col: bestMatch, confidence: Math.min(100, Math.round(bestScore)) };
        usedHeaders.add(bestMatch);
      }
    });

    return mapping;
  },

  processRow(row: any, mapping: Record<string, string>, mode: ImportMode): { data: any, isValid: boolean, errors: string[] } {
    const schema = this.getSchema(mode);
    const result: any = {};
    let isValid = true;
    const errors: string[] = [];

    schema.forEach(field => {
      const sourceHeader = mapping[field.key];
      let value = sourceHeader ? row[sourceHeader] : undefined;

      // Normalização e Validação
      if (value !== undefined && value !== null && String(value).trim() !== '') {
          if (field.key === 'baseUnit' || field.key === 'unit') {
              result[field.key] = normalizeUnit(String(value));
          } 
          else if (field.type === 'string') {
              result[field.key] = String(value).trim();
          } 
          else if (field.type === 'number') {
             const num = parseExcelNumber(value);
             if (num === null) {
                 if (field.required) { isValid = false; errors.push(`${field.label}: Número inválido`); }
                 result[field.key] = 0; 
             } else {
                 if (field.validator && !field.validator(num)) {
                     isValid = false;
                     errors.push(`${field.label}: ${field.errorMessage || 'Valor inválido'}`);
                 }
                 result[field.key] = num;
             }
          } 
          else if (field.type === 'date') {
             const dt = parseExcelDate(value);
             if (!dt) {
                 if (field.required) { isValid = false; errors.push(`${field.label}: Data inválida`); }
                 result[field.key] = null;
             } else {
                 result[field.key] = dt;
             }
          } 
          else if (field.type === 'risks') {
             const rStr = String(value).toUpperCase();
             const risksObj: RiskFlags = { O: false, T: false, T_PLUS: false, C: false, E: false, N: false, Xn: false, Xi: false, F: false, F_PLUS: false };
             const has = (terms: string[]) => terms.some(t => rStr.includes(t));
             // Mapeamento GHS (Simplificado)
             if (has(['GHS01', 'EXPLOSIV', 'BOMBA'])) risksObj.E = true;
             if (has(['GHS02', 'INFLAM', 'FOGO', 'FIRE', 'FLAM', 'F '])) risksObj.F = true;
             if (has(['EXTREMAMENTE', 'F+', 'EXTR.'])) risksObj.F_PLUS = true;
             if (has(['GHS03', 'OXID', 'COMBUR', 'O2'])) risksObj.O = true;
             if (has(['GHS05', 'CORROS', 'ACID', 'BASE', 'CAUSTIC'])) risksObj.C = true;
             if (has(['GHS06', 'TOXIC', 'VENEN', 'POISON'])) risksObj.T = true;
             if (has(['MUITO TOXIC', 'T+', 'GRAVE', 'CANCER', 'MUTAGEN'])) risksObj.T_PLUS = true;
             if (has(['GHS09', 'AMBIEN', 'POLU', 'PEIXE'])) risksObj.N = true;
             if (has(['GHS07', 'NOCIV', 'IRRIT', 'XN', 'HARMFUL'])) risksObj.Xn = true;
             if (has(['XI', 'IRRITANT'])) risksObj.Xi = true;
             result[field.key] = risksObj;
          }
      } else {
          // Defaults
          if (field.required) {
              isValid = false;
              errors.push(`${field.label} é obrigatório`);
          }
          if (field.type === 'number') result[field.key] = 0;
          else if (field.type === 'risks') result[field.key] = null;
          else result[field.key] = ''; 
      }
    });

    return { data: result, isValid, errors };
  }
};
