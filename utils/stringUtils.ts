
// Shared Intl.Collator for performance
export const defaultCollator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });

// Regex pré-compilado para performance
const CLEAN_REGEX = /[^A-Z0-9]/g;
const MULTI_SPACE_REGEX = /\s+/g;

// Mapa de Normalização de Unidades
const UNIT_MAP: Record<string, string> = {
    'L': 'L', 'LITRO': 'L', 'LITROS': 'L', 'LT': 'L', 'LTS': 'L',
    'ML': 'ml', 'MILILITRO': 'ml', 'MLS': 'ml',
    'KG': 'kg', 'QUILO': 'kg', 'KILO': 'kg', 'QUILOGRAMA': 'kg',
    'G': 'g', 'GR': 'g', 'GRAMA': 'g', 'GRAMAS': 'g',
    'MG': 'mg', 'MILIGRAMA': 'mg',
    'UN': 'UN', 'UNID': 'UN', 'UNIDADE': 'UN', 'PC': 'UN', 'PCA': 'UN', 'PEÇA': 'UN',
    'CX': 'CX', 'CAIXA': 'CX', 'BOX': 'CX',
    'M': 'm', 'METRO': 'm',
    'CM': 'cm', 'CENTIMETRO': 'cm'
};

// Dicionário de correções e expansões comuns de Laboratório
const PRODUCT_CORRECTIONS: Record<string, string> = {
    // Erros Comuns (Typos)
    'ERLEMEYER': 'ERLENMEYER',
    'ERLEMMEYER': 'ERLENMEYER',
    'PISETA': 'PISSETA',
    'DESECADOR': 'DESSECADOR',
    'ALCOL': 'ÁLCOOL',
    'ALCOOL': 'ÁLCOOL',
    'FEROVER': 'FERROVER',
    'KITASATO': 'KITASSATO',
    'BARAMAGNÉTICA': 'BARRA MAGNÉTICA',
    'BARAMAGNETICA': 'BARRA MAGNÉTICA',
    'CONDUTIVIMETRO': 'CONDUTIVÍMETRO',
    'TERMOCOMPENSADOR': 'TERMOLIQUIDO',
    'ALMOXARIZ': 'ALMOFARIZ',
    
    // Abreviações Químicas
    'AC': 'ÁCIDO',
    'AC.': 'ÁCIDO',
    'ACIDO': 'ÁCIDO',
    'SOL': 'SOLUÇÃO',
    'SOL.': 'SOLUÇÃO',
    'SOLUCAO': 'SOLUÇÃO',
    'HIDROX': 'HIDRÓXIDO',
    'HIDROX.': 'HIDRÓXIDO',
    'HIDROXIDO': 'HIDRÓXIDO',
    'CLOR': 'CLORETO',
    'CLOR.': 'CLORETO',
    'CLORETO': 'CLORETO',
    'SULF': 'SULFATO',
    'SULF.': 'SULFATO',
    'SULFURICO': 'SULFÚRICO',
    'CLORIDRICO': 'CLORÍDRICO',
    'ACETICO': 'ACÉTICO',
    'AMONIO': 'AMÔNIO',
    'POTASSIO': 'POTÁSSIO',
    'POTASIO': 'POTÁSSIO',
    'SODIO': 'SÓDIO',
    'CALCIO': 'CÁLCIO',
    'NITRILICA': 'NITRÍLICA',
    'LATEX': 'LÁTEX',
    'GLICERINA': 'GLICERINA',
    'ELETRODO': 'ELETRODO',
    'REAGENTE': 'REAGENTE',
    'TAMPAO': 'TAMPÃO',
    'PADRAO': 'PADRÃO',
    'ANALISE': 'ANÁLISE',
    'SILICA': 'SÍLICA',
    'ORGANICOS': 'ORGÂNICOS',
    'AMINO': 'AMINO',
    'BENZOICO': 'BENZÓICO',
    'MONOBASICO': 'MONOBÁSICO',
    'CITRICO': 'CÍTRICO',
    'AGUAS': 'ÁGUAS'
};

// Regex Específicos para tratamento avançado
const PURITY_GRADE_REGEX = /\b(P\.?A\.?|U\.?S\.?P\.?|H\.?P\.?L\.?C\.?)\b/gi;
const PERCENT_REGEX = /\s*%\s*/g;
const HYDRATION_REGEX = /(\d*)\s*H2O/gi; // Ex: 2 H2O -> 2H2O

export const normalizeStr = (str: string): string => {
    if (!str) return '';
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove acentos
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");      // Mantém apenas alfanuméricos
};

/**
 * Remove prefixos comuns de banco de dados e normaliza.
 */
export const cleanHeader = (header: string): string => {
    if (!header) return '';
    let cleaned = header.toLowerCase().trim();
    cleaned = cleaned.replace(/^(nm|ds|dt|vl|nr|cd|id|tx)_/i, '');
    cleaned = cleaned.replace(/(_id|_cod)$/i, '');
    return normalizeStr(cleaned);
};

export const cleanStr = (s: string) => String(s || '').trim().toUpperCase().replace(CLEAN_REGEX, '');

/**
 * Normaliza Unidades de Medida para evitar duplicidade (ex: LT -> L)
 */
export const normalizeUnit = (unit: string): string => {
    if (!unit) return 'UN';
    const clean = cleanStr(unit);
    return UNIT_MAP[clean] || unit.toUpperCase().substring(0, 5); // Fallback to raw up to 5 chars
};

/**
 * Divide uma string em tokens limpos para comparação semântica.
 * Ex: "Data de Validade" -> ["data", "validade"]
 */
export const tokenizeHeader = (header: string): string[] => {
    if (!header) return [];
    return header
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, " ") // Troca símbolos por espaço
        .split(/\s+/)
        .filter(w => w.length > 1 && !['de', 'da', 'do', 'em', 'para', 'com'].includes(w));
};

/**
 * Higieniza nomes de produtos para exibição (UI).
 */
export const sanitizeProductName = (rawName: string): string => {
    if (!rawName) return 'Item Desconhecido';

    let clean = String(rawName).trim().toUpperCase();

    // 1. Tratamento de Separadores "Sujos"
    clean = clean.replace(/_/g, ' ');
    clean = clean.replace(/([A-Z])\.([A-Z])/g, '$1 $2');

    // 2. Normalizar espaços múltiplos
    clean = clean.replace(MULTI_SPACE_REGEX, ' ').trim();

    // 3. Padronização de Graus de Pureza
    clean = clean.replace(PURITY_GRADE_REGEX, (match) => {
        const normalized = match.replace(/\./g, '') + '.';
        if (normalized === 'PA.') return 'P.A.';
        if (normalized === 'USP.') return 'U.S.P.';
        if (normalized === 'HPLC.') return 'H.P.L.C.';
        return match;
    });

    // 4. Padronização de Símbolos
    clean = clean.replace(PERCENT_REGEX, '%');
    clean = clean.replace(HYDRATION_REGEX, '$1H2O');

    // 5. Tokenização e Correção Ortográfica
    const tokens = clean.split(' ');
    const correctedTokens = tokens.map(token => {
        let cleanToken = token;
        if (token !== 'P.A.' && token !== 'U.S.P.') {
            cleanToken = token.replace(/[^A-Z0-9ÁÉÍÓÚÂÊÔÃÕÇ%/-]+$/g, ''); 
        }
        
        if (PRODUCT_CORRECTIONS[cleanToken]) {
            return PRODUCT_CORRECTIONS[cleanToken];
        }
        return cleanToken;
    });

    return correctedTokens.join(' ');
};

export const generateInventoryId = (sap: string, name: string, lot: string): string => {
    const cSap = cleanStr(sap);
    const cLot = lot ? cleanStr(lot) : 'GEN';
    
    // Prioridade máxima para SAP Code se for válido
    if (cSap && cSap.length > 2 && cSap !== 'NSAP' && cSap !== 'SSAP' && cSap !== 'NA' && cSap !== '0') {
        return `${cSap}-${cLot}`;
    }
    
    // Fallback robusto usando Hash do nome normalizado para evitar colisão de strings longas
    const cName = cleanStr(name);
    if (cName && cName.length > 0) {
        // Usa hash para manter o ID curto e determinístico
        const nameHash = generateHash(cName); 
        return `NOSAP-${nameHash}-${cLot}`;
    }

    return `UNK-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
};

export const generateHash = (str: string): string => {
    let hash = 0;
    if (str.length === 0) return '000000';
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return Math.abs(hash).toString(16).toUpperCase();
};

export const levenshteinDistance = (a: string, b: string): number => {
    const matrix = [];
    let i, j;
    for (i = 0; i <= b.length; i++) matrix[i] = [i];
    for (j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) == a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
                );
            }
        }
    }
    return matrix[b.length][a.length];
};

export const calculateSimilarity = (header: string, keyword: string): number => {
    const h = normalizeStr(header);
    const k = normalizeStr(keyword);
    
    if (h === k) return 1.0;
    if (h.includes(k) || k.includes(h)) return 0.95;
    
    const longer = h.length > k.length ? h : k;
    if (longer.length === 0) return 1.0;
    const dist = levenshteinDistance(h, k);
    return (longer.length - dist) / longer.length;
};
