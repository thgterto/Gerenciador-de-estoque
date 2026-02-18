
import { RiskFlags } from '../types';
import { normalizeStr, calculateSimilarity, cleanHeader, normalizeUnit } from './stringUtils';
import * as XLSX from 'xlsx';

export type ImportMode = 'MASTER' | 'HISTORY';

export interface ColumnDefinition {
  key: string;
  label: string;
  required: boolean;
  regex: RegExp[];
  type: 'string' | 'number' | 'date' | 'risks' | 'boolean';
  validator?: (value: any) => boolean;
  errorMessage?: string;
}

export interface DetectedTable {
    id: string;
    rowIndex: number; // Linha onde começa o cabeçalho (0-based)
    confidence: number;
    preview: string[]; // Headers encontrados
    rowCountEstimate: number;
}

// --- PARSERS AVANÇADOS ---

const parseExcelDate = (value: any): string | null => {
  if (value === null || value === undefined || value === '') return null;
  
  // Caso 1: Serial do Excel (Número) - ex: 45283
  if (typeof value === 'number') {
    if (value < 1000) return null; // Números muito baixos provavelmente não são datas recentes
    const utc_days = Math.floor(value - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    // Ajuste de timezone simplificado para evitar bug de dia anterior
    const adjustedDate = new Date(date_info.getTime() + (date_info.getTimezoneOffset() * 60000) + (12 * 3600000));
    if (isNaN(adjustedDate.getTime()) || adjustedDate.getFullYear() < 1990) return null;
    return adjustedDate.toISOString().split('T')[0];
  }
  
  const str = String(value).trim();
  
  // Caso 2: Strings BR (DD/MM/AAAA) e variações
  const ptBrMatch = str.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  if (ptBrMatch) {
      const day = parseInt(ptBrMatch[1], 10);
      const month = parseInt(ptBrMatch[2], 10);
      let year = parseInt(ptBrMatch[3], 10);
      if (year < 100) year += 2000; 
      
      const dt = new Date(year, month - 1, day);
      if (!isNaN(dt.getTime()) && dt.getFullYear() > 1900) return dt.toISOString().split('T')[0];
  }
  
  // Caso 3: ISO (YYYY-MM-DD)
  const isoMatch = str.match(/^(\d{4})[/.-](\d{1,2})[/.-](\d{1,2})/);
  if (isoMatch) {
      const dt = new Date(str);
      if (!isNaN(dt.getTime())) return dt.toISOString().split('T')[0];
  }
  
  return null;
};

const parseExcelNumber = (value: any): number | null => {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number') return isNaN(value) ? null : value;
    
    let str = String(value).trim();
    str = str.replace(/[R$€£\s]/g, '');
    
    const lastComma = str.lastIndexOf(',');
    const lastDot = str.lastIndexOf('.');
    
    if (lastComma > lastDot && lastComma > -1) {
        str = str.replace(/\./g, '').replace(',', '.');
    } else if (lastDot > -1) {
        str = str.replace(/,/g, '');
    }
    
    const num = parseFloat(str);
    return isNaN(num) ? null : num;
};

const parseBoolean = (value: any): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'boolean') return value;
    const str = String(value).trim().toLowerCase();
    // Aceita: X, S, Sim, Yes, Y, V, True, 1, Ok
    return /^(x|s|sim|y|yes|v|true|1|ok)$/.test(str);
};

// --- SCHEMAS DE IMPORTAÇÃO ---

const MASTER_SCHEMA: ColumnDefinition[] = [
  { key: 'name', label: 'Produto / Descrição', required: true, regex: [/nome/i, /produto/i, /descricao/i, /descri/i, /material/i, /item/i, /desc\./i, /denominacao/i, /description/i], type: 'string' },
  { key: 'sapCode', label: 'Código SAP / SKU', required: false, regex: [/sap/i, /sku/i, /cod/i, /cód/i, /artigo/i, /part.*number/i, /ref/i, /^cdsap$/i, /^id$/i], type: 'string' },
  { key: 'lotNumber', label: 'Lote / Série', required: false, regex: [/^lote$/i, /batch/i, /serie/i, /série/i, /lot/i, /n_lote/i, /control/i], type: 'string' },
  { key: 'baseUnit', label: 'Unidade (UN/L/Kg)', required: false, regex: [/un/i, /medida/i, /emb/i, /unit/i, /u\.m/i, /unidade/i, /uom/i], type: 'string' },
  { key: 'expiryDate', label: 'Validade', required: false, regex: [/val/i, /venc/i, /vcto/i, /exp/i, /shelf/i, /validade/i, /data.*val/i], type: 'date' },
  { key: 'category', label: 'Categoria', required: false, regex: [/cat/i, /grupo/i, /tipo/i, /fam/i, /classe/i], type: 'string' },
  { key: 'supplier', label: 'Fornecedor', required: false, regex: [/fabr/i, /forn/i, /marca/i, /brand/i, /manuf/i, /vendor/i], type: 'string' },
  { key: 'warehouse', label: 'Local (Armazém)', required: false, regex: [/local/i, /armazem/i, /sala/i, /almox/i, /deposito/i, /setor/i, /lab/i], type: 'string' },
  { key: 'cabinet', label: 'Armário/Geladeira', required: false, regex: [/armario/i, /geladeira/i, /freezer/i, /bancada/i, /gaveta/i, /cabinet/i], type: 'string' },
  { key: 'minStockLevel', label: 'Estoque Mínimo', required: false, regex: [/min/i, /alerta/i, /ponto.*repo/i, /seguranca/i, /reorder/i], type: 'number' },
  { key: 'casNumber', label: 'CAS Number', required: false, regex: [/cas/i, /registro.*quimico/i, /chemical/i], type: 'string' },
  
  // Riscos Individuais (GHS Columns) - Mapeamento Estrito
  { key: 'risk_O', label: 'GHS: O (Oxidante)', required: false, regex: [/^O$/i, /^Oxidante$/i, /^GHS03$/i], type: 'boolean' },
  { key: 'risk_T', label: 'GHS: T (Tóxico)', required: false, regex: [/^T$/i, /^Toxico$/i, /^GHS06$/i], type: 'boolean' },
  { key: 'risk_T_PLUS', label: 'GHS: T+ (Muito Tóxico)', required: false, regex: [/^T\+$/i, /^Muito Toxico$/i], type: 'boolean' },
  { key: 'risk_C', label: 'GHS: C (Corrosivo)', required: false, regex: [/^C$/i, /^Corrosivo$/i, /^GHS05$/i], type: 'boolean' },
  { key: 'risk_E', label: 'GHS: E (Explosivo)', required: false, regex: [/^E$/i, /^Explosivo$/i, /^GHS01$/i], type: 'boolean' },
  { key: 'risk_N', label: 'GHS: N (Ambiental)', required: false, regex: [/^N$/i, /^Ambiental$/i, /^Meio Ambiente$/i, /^GHS09$/i], type: 'boolean' },
  { key: 'risk_Xn', label: 'GHS: Xn (Nocivo)', required: false, regex: [/^Xn$/i, /^Nocivo$/i, /^GHS07$/i], type: 'boolean' },
  { key: 'risk_Xi', label: 'GHS: Xi (Irritante)', required: false, regex: [/^Xi$/i, /^Irritante$/i], type: 'boolean' },
  { key: 'risk_F', label: 'GHS: F (Inflamável)', required: false, regex: [/^F$/i, /^Inflamavel$/i, /^GHS02$/i], type: 'boolean' },
  { key: 'risk_F_PLUS', label: 'GHS: F+ (Ext. Inflamável)', required: false, regex: [/^F\+$/i, /^Extremamente Inflamavel$/i], type: 'boolean' },

  // Fallback (Texto Geral)
  { key: 'risks', label: 'Riscos (Texto Geral)', required: false, regex: [/risc/i, /ghs/i, /perig/i, /seguranca/i, /msds/i, /class.*risco/i], type: 'risks' },
];

const HISTORY_SCHEMA: ColumnDefinition[] = [
  { key: 'date', label: 'Data', required: true, regex: [/data/i, /date/i, /dia/i, /hora/i, /dt\./i, /emissao/i, /movimentacao/i], type: 'date' },
  { key: 'type', label: 'Tipo (Ent/Sai)', required: true, regex: [/tipo/i, /oper/i, /mov/i, /natureza/i, /transacao/i, /action/i], type: 'string' },
  { key: 'productName', label: 'Produto', required: false, regex: [/nome/i, /prod/i, /desc/i, /material/i], type: 'string' },
  { key: 'quantity', label: 'Quantidade', required: true, regex: [/qtd/i, /quant/i, /volume/i, /qt_mov/i], type: 'number', validator: (v) => typeof v === 'number' && v > 0 },
  { key: 'sapCode', label: 'Código SAP', required: false, regex: [/sap/i, /cod/i, /sku/i], type: 'string' },
  { key: 'lotNumber', label: 'Lote', required: false, regex: [/^lote$/i, /batch/i], type: 'string' },
  { key: 'unit', label: 'Unidade', required: false, regex: [/unid/i, /medida/i], type: 'string' },
  { key: 'observation', label: 'Observação', required: false, regex: [/obs/i, /motivo/i, /justif/i, /nota/i, /hist/i], type: 'string' },
  { key: 'supplier', label: 'Origem/Destino', required: false, regex: [/forn/i, /origem/i, /destino/i, /fabr/i], type: 'string' },
  { key: 'warehouse', label: 'Local', required: false, regex: [/local/i, /armazem/i], type: 'string' }
];

// --- DATA SNIFFING (Análise de Tipos) ---
const sniffColumnType = (header: string, sampleData: any[]): { isDate: number, isNumber: number, isText: number, isBoolean: number } => {
    let validDates = 0;
    let validNumbers = 0;
    let validBooleans = 0;
    let totalSamples = 0;

    const samples = sampleData.slice(0, 50).map(row => row[header]).filter(v => v !== undefined && v !== null && String(v).trim() !== '');
    
    if (samples.length === 0) return { isDate: 0, isNumber: 0, isText: 0, isBoolean: 0 };

    samples.forEach(val => {
        totalSamples++;
        const num = parseExcelNumber(val);
        const date = parseExcelDate(val);
        const bool = parseBoolean(val);

        if (num !== null) validNumbers++;
        if (date !== null) {
            const isExcelDate = typeof val === 'number' && val > 20000;
            const isStringDate = typeof val === 'string' && (/[/.-]/.test(val));
            if (isExcelDate || isStringDate) validDates++;
        }
        if (bool) validBooleans++;
    });

    return {
        isDate: totalSamples > 0 ? validDates / totalSamples : 0,
        isNumber: totalSamples > 0 ? validNumbers / totalSamples : 0,
        isBoolean: totalSamples > 0 ? validBooleans / totalSamples : 0,
        isText: 1.0 
    };
};

export const ImportEngine = {
  getSchema(mode: ImportMode) {
    return mode === 'MASTER' ? MASTER_SCHEMA : HISTORY_SCHEMA;
  },

  // 1. Detecção de Tabelas na Planilha
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
                 if (field.regex.some(r => r.test(cellNorm) || r.test(cellClean) || r.test(cellVal))) {
                     matchScore += 20;
                     hasMatch = true;
                 }
             });
             if (hasMatch) validColumns++;
         });

         if (validColumns >= 2 && matchScore >= 40) {
             let dataRowsCount = 0;
             for (let j = 1; j <= 5; j++) {
                 const nextRow = rawRows[i + j];
                 if (nextRow && Array.isArray(nextRow) && nextRow.some(c => c !== undefined && c !== '')) {
                     dataRowsCount++;
                 }
             }
             if (dataRowsCount >= 1) {
                 candidates.push({
                     id: `table-row-${i}`,
                     rowIndex: i,
                     confidence: Math.min(100, matchScore + (validColumns * 5) + (dataRowsCount * 2)),
                     preview: rowPreview.slice(0, 5),
                     rowCountEstimate: rawRows.length - i - 1
                 });
             }
         }
     }
     return candidates.sort((a, b) => b.confidence - a.confidence);
  },

  // 2. Sugestão de Mapeamento (Inteligente)
  suggestMapping(headers: string[], sampleData: any[], mode: ImportMode): Record<string, { col: string, confidence: number }> {
    const schema = this.getSchema(mode);
    const mapping: Record<string, { col: string, confidence: number }> = {};
    const usedHeaders = new Set<string>();

    const columnStats: Record<string, { isDate: number, isNumber: number, isBoolean: number }> = {};
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
        const rawHeader = header.trim(); // Use raw for exact matches like "F", "O"
        
        // A. Match Textual (Regex)
        if (field.regex.some(r => r.test(rawHeader) || r.test(normHeader) || r.test(cleanedHeader))) {
            score = 90;
            // Boost se o match for exato (para GHS columns curtas como 'F')
            if (field.type === 'boolean' && field.key.startsWith('risk_')) {
                 if (field.regex.some(r => r.test(rawHeader))) score += 5;
            }
        } else {
            const simLabel = calculateSimilarity(header, field.label);
            const simKey = calculateSimilarity(cleanedHeader, field.key);
            score = Math.max(simLabel, simKey) * 60; 
        }

        // B. Match de Tipo de Dado
        const stats = columnStats[header];
        if (stats) {
            if (field.type === 'date') {
                if (stats.isDate > 0.5) score += 20; 
                else if (stats.isNumber < 0.1 && score > 0) score -= 40; 
            }
            if (field.type === 'number') {
                if (stats.isNumber > 0.7) score += 15;
                else if (stats.isNumber < 0.1) score -= 60;
            }
            if (field.type === 'boolean') {
                // Se o campo é booleano (ex: Risk_F), e a coluna tem dados booleanos (X, Sim, 1), aumenta score
                if (stats.isBoolean > 0.1) score += 20; 
            }
        }

        // C. Desempate
        if (field.key === 'quantity' && (normHeader.includes('min') || normHeader.includes('critico'))) {
            score -= 50; 
        }

        if (score > bestScore) {
          bestScore = score;
          bestMatch = header;
        }
      });

      if (bestScore >= 50 && !usedHeaders.has(bestMatch)) {
        mapping[field.key] = { col: bestMatch, confidence: Math.min(100, Math.round(bestScore)) };
        usedHeaders.add(bestMatch);
      }
    });

    return mapping;
  },

  // 3. Processamento e Validação
  processRow(row: any, mapping: Record<string, string>, mode: ImportMode): { data: any, isValid: boolean, errors: string[] } {
    const schema = this.getSchema(mode);
    const result: any = {};
    let isValid = true;
    const errors: string[] = [];
    
    // Objeto acumulador de riscos
    const risksObj: RiskFlags = { O: false, T: false, T_PLUS: false, C: false, E: false, N: false, Xn: false, Xi: false, F: false, F_PLUS: false };
    
    schema.forEach(field => {
      const sourceHeader = mapping[field.key];
      const value = sourceHeader ? row[sourceHeader] : undefined;

      // Se for uma coluna de risco booleana e tivermos mapeamento, processa
      if (field.type === 'boolean' && field.key.startsWith('risk_')) {
          if (value !== undefined && value !== null && String(value).trim() !== '') {
              // Verifica se é true, 'x', 'sim', '1', etc.
              if (parseBoolean(value)) {
                  // Extrai o código do risco da chave (ex: risk_F_PLUS -> F_PLUS)
                  const code = field.key.replace('risk_', '');
                  if (code in risksObj) {
                      risksObj[code as keyof RiskFlags] = true;
                  }
              }
          }
      }

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
             // Processamento da coluna única de texto "Riscos" (Compatibilidade)
             const rStr = String(value).toUpperCase();
             const has = (terms: string[]) => terms.some(t => rStr.includes(t));
             
             if (has(['GHS01', 'EXPLOSIV', 'BOMBA'])) risksObj.E = true;
             if (has(['GHS02', 'INFLAM', 'FOGO', 'FIRE', 'FLAM'])) risksObj.F = true;
             if (has(['EXTREMAMENTE', 'F+', 'EXTR.'])) risksObj.F_PLUS = true;
             if (has(['GHS03', 'OXID', 'COMBUR', 'O2'])) risksObj.O = true;
             if (has(['GHS05', 'CORROS', 'ACID', 'BASE', 'CAUSTIC'])) risksObj.C = true;
             if (has(['GHS06', 'TOXIC', 'VENEN', 'POISON'])) risksObj.T = true;
             if (has(['MUITO TOXIC', 'T+', 'GRAVE', 'CANCER', 'MUTAGEN'])) risksObj.T_PLUS = true;
             if (has(['GHS09', 'AMBIEN', 'POLU', 'PEIXE'])) risksObj.N = true;
             if (has(['GHS07', 'NOCIV', 'IRRIT', 'XN', 'HARMFUL'])) risksObj.Xn = true;
             if (has(['XI', 'IRRITANT'])) risksObj.Xi = true;
          }
      } else {
          if (field.required) {
              isValid = false;
              errors.push(`${field.label} é obrigatório`);
          }
          if (field.type === 'number') result[field.key] = 0;
          else result[field.key] = ''; 
      }
    });

    // Anexa o objeto de riscos consolidado ao resultado final
    result.risks = risksObj;

    return { data: result, isValid, errors };
  }
};
