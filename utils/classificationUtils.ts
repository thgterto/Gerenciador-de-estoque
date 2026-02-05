import { normalizeStr } from './stringUtils';

// Dicionário de Categorias por Palavras-chave
const CATEGORY_KEYWORDS: Record<string, string[]> = {
    'REAGENTES': ['ACIDO', 'BASE', 'SOLUCAO', 'HIDROXIDO', 'CLORETO', 'SULFATO', 'NITRATO', 'ACETONA', 'ALCOOL', 'ETANOL', 'METANOL', 'REAGENTE', 'PADRAO', 'TAMPÃO', 'BUFFER', 'SOLVENTE'],
    'VIDRARIAS': ['BECKER', 'BEQUER', 'ERLENMEYER', 'PROVETA', 'PIPETA', 'BURETA', 'BALAO', 'TUBOS', 'PLACA DE PETRI', 'VIDRO', 'CALICE', 'KITASSATO', 'FUNIL'],
    'EQUIPAMENTOS': ['BALANCA', 'ESTUFA', 'MICROSCOPIO', 'PHMETRO', 'AGITADOR', 'CENTRIFUGA', 'BOMBA', 'ESPECTRO', 'CONDUTIVIMETRO', 'TURBIDIMETRO', 'AUTOCLAVE'],
    'CONSUMIVEIS': ['LUVA', 'MASCARA', 'PAPEL', 'FILTRO', 'PONTEIRA', 'SERINGA', 'AGULHA', 'LAMINULA', 'LAMINA', 'SWAB', 'COLETOR'],
    'MEIOS DE CULTURA': ['AGAR', 'CALDO', 'MEIO', 'CULTURA'],
    'PEÇAS DE REPOSIÇÃO': ['ROLAMENTO', 'SENSOR', 'CABO', 'ELETRODO', 'LAMPADA', 'FUSIVEL', 'CONEXAO', 'ADAPTADOR', 'VALVULA', 'VEDACAO', 'O-RING', 'JUNTAS'],
    'MATERIAL DE LIMPEZA': ['RODO', 'VASSOURA', 'DETERGENTE', 'SABAO', 'DESINFETANTE', 'PANO', 'ESPONJA', 'SACO DE LIXO', 'LIXEIRA', 'BALDE']
};

// Dicionário de Sugestões de CAS (Nome Comum -> CAS)
const COMMON_CAS_NUMBERS: Record<string, string> = {
    'ACETONA': '67-64-1',
    'ACIDO ACETICO': '64-19-7',
    'ACIDO CLORIDRICO': '7647-01-0',
    'ACIDO NITRICO': '7697-37-2',
    'ACIDO SULFURICO': '7664-93-9',
    'AGUA': '7732-18-5',
    'ALCOOL ETILICO': '64-17-5',
    'ETANOL': '64-17-5',
    'ALCOOL METILICO': '67-56-1',
    'METANOL': '67-56-1',
    'AMONIA': '7664-41-7',
    'CLOROFORMIO': '67-66-3',
    'DICLOROMETANO': '75-09-2',
    'ETER ETILICO': '60-29-7',
    'GLICERINA': '56-81-5',
    'HEXANO': '110-54-3',
    'HIDROXIDO DE SODIO': '1310-73-2',
    'HIDROXIDO DE POTASSIO': '1310-58-3',
    'ISOPROPANOL': '67-63-0',
    'PEROXIDO DE HIDROGENIO': '7722-84-1',
    'TOLUENO': '108-88-3',
    'XILENO': '1330-20-7'
};

/**
 * Identifica a categoria de um item com base em seu nome.
 */
export const identifyCategory = (itemName: string): string => {
    const cleanName = normalizeStr(itemName).toUpperCase(); // normalizeStr remove espaços e caracteres especiais

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (keywords.some(k => cleanName.includes(normalizeStr(k).toUpperCase()))) {
            return category;
        }
    }

    return 'OUTROS';
};

/**
 * Sugere um CAS Number com base no nome do item.
 */
export const suggestCasNumber = (itemName: string): string | null => {
    const cleanName = normalizeStr(itemName).toUpperCase();

    // Tentativa de match exato ou parcial no início
    for (const [name, cas] of Object.entries(COMMON_CAS_NUMBERS)) {
        const cleanKey = normalizeStr(name).toUpperCase();
        if (cleanName.includes(cleanKey)) {
            return cas;
        }
    }

    return null;
};
