import { RiskFlags, CasDataDTO } from '../types';

// API Key movida para variável de ambiente
// SECURITY FIX: Safe access pattern for import.meta.env to prevent runtime crashes if env is undefined
const getEnv = (): any => {
    try {
        return import.meta.env || {};
    } catch {
        return {};
    }
};

const env = getEnv();
const API_KEY = env.VITE_CAS_API_KEY || '';
const BASE_URL = 'https://commonchemistry.cas.org/api';

export const CasApiService = {
    /**
     * Remove formatação do CAS para uso interno (ex: 67-64-1 -> 67641)
     */
    normalizeCas(cas: string) {
        return cas.replace(/[^0-9]/g, '');
    },

    /**
     * Valida o formato e o checksum matemático de um número CAS.
     * Algoritmo: (i * d_i) ... soma % 10 == digito_verificador
     */
    isValidCas(casInput: string): boolean {
        if (!casInput) return false;
        
        const cleanCas = casInput.trim();
        
        // Verifica formato básico: 2 a 7 dígitos - 2 dígitos - 1 dígito
        if (!/^\d{2,7}-\d{2}-\d$/.test(cleanCas)) return false;

        const parts = cleanCas.split('-');
        
        // O último dígito é o verificador
        const checkDigit = parseInt(parts[2], 10);
        
        // Concatena a primeira e segunda parte para iterar (reverso)
        const digits = (parts[0] + parts[1]).split('').reverse();
        
        let sum = 0;
        for (let i = 0; i < digits.length; i++) {
            // Multiplica o dígito pela sua posição (1-based)
            sum += parseInt(digits[i], 10) * (i + 1);
        }

        return (sum % 10) === checkDigit;
    },

    /**
     * Gera URL para imagem da estrutura química via PubChem (Fallback robusto).
     */
    getPubChemImageUrl(cas: string): string {
        // PubChem aceita CAS com traços
        return `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/xref/rn/${cas.trim()}/PNG?record_type=2d&image_size=small`;
    },

    /**
     * Busca dados do composto na API (Common Chemistry).
     * Inclui validação de checksum antes da requisição.
     */
    async fetchChemicalData(casNumber: string): Promise<CasDataDTO | null> {
        // Validação Prévia: Evita chamadas de API para números matematicamente inválidos
        if (!this.isValidCas(casNumber)) {
            console.warn(`CAS Inválido (Checksum falhou): ${casNumber}`);
            return null;
        }

        // SECURITY CHECK: Ensure API Key is present
        if (!API_KEY) {
            console.warn("CAS API Key not configured in environment. Skipping fetch.");
            return null;
        }

        const cleanCas = this.normalizeCas(casNumber);

        try {
            const response = await fetch(`${BASE_URL}/detail?cas_rn=${cleanCas}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-KEY': API_KEY
                }
            });

            if (!response.ok) {
                if (response.status === 404) return null;
                console.warn(`CAS API Warning: ${response.status} ${response.statusText}`);
                return null;
            }

            const data = await response.json();
            
            // Injeta a URL de imagem do PubChem caso a do CAS falhe ou como alternativa
            return {
                ...data,
                // Opcional: Você pode preferir a imagem do PubChem se a do CAS tiver token expirado
                pubChemImage: this.getPubChemImageUrl(casNumber) 
            } as CasDataDTO;
            
        } catch (error) {
            // Silencia erros de rede/CORS para não quebrar a UX
            console.warn("CAS API indisponível ou bloqueada por CORS:", error);
            return null;
        }
    },

    /**
     * Processa uma lista de CAS Numbers em série com delay para respeitar rate limits.
     */
    async fetchBatchChemicalData(casList: string[], onProgress?: (current: number, total: number) => void): Promise<Record<string, CasDataDTO | null>> {
        const results: Record<string, CasDataDTO | null> = {};
        const uniqueCas = Array.from(new Set(casList.filter(c => !!c))); // Deduplicate
        let processed = 0;

        const RATE_LIMIT_DELAY = 600;

        // Chain promises to ensure start times are spaced out
        let delayChain = Promise.resolve();
        const promises: Promise<void>[] = [];

        for (const cas of uniqueCas) {
            // Schedule the delay relative to the previous start
            const delayPromise = delayChain.then(() => new Promise<void>(resolve => setTimeout(resolve, RATE_LIMIT_DELAY)));
            delayChain = delayPromise;

            // Execute the task after the delay, but don't block the next delay scheduling on the task completion
            const task = delayPromise.then(async () => {
                try {
                    const data = await this.fetchChemicalData(cas);
                    if (data) {
                        results[cas] = data;
                    }
                } catch (e) {
                    results[cas] = null;
                } finally {
                    processed++;
                    if (onProgress) onProgress(processed, uniqueCas.length);
                }
            });

            promises.push(task);
        }

        await Promise.all(promises);
        return results;
    },

    /**
     * Aplica heurística para sugerir flags de risco baseadas nas propriedades e nome retornados.
     */
    analyzeRisks(data: CasDataDTO): Partial<RiskFlags> {
        const risks: RiskFlags = { 
            O: false, T: false, T_PLUS: false, C: false, E: false, 
            N: false, Xn: false, Xi: false, F: false, F_PLUS: false 
        };
        
        if (!data) return risks;

        const fullText = JSON.stringify(data).toUpperCase();

        // Mapeamento de Keywords -> Risco
        if (fullText.includes('FLAM') || fullText.includes('FIRE') || fullText.includes('FLASH POINT')) risks.F = true;
        if (fullText.includes('EXPLOS')) risks.E = true;
        if (fullText.includes('OXID')) risks.O = true;
        if (fullText.includes('TOXIC') || fullText.includes('POISON') || fullText.includes('VENEN')) risks.T = true;
        if (fullText.includes('CORROS') || fullText.includes('ACID') || fullText.includes('BASE') || fullText.includes('CAUSTIC')) risks.C = true;
        if (fullText.includes('IRRIT')) risks.Xi = true;
        if (fullText.includes('CARCINOGEN') || fullText.includes('MUTAGEN') || fullText.includes('TERATOGEN')) risks.T_PLUS = true;
        if (fullText.includes('ENVIRON') || fullText.includes('AQUATIC')) risks.N = true;

        return risks;
    },

    /**
     * Formata o nome do produto (remove tags HTML que às vezes vêm da API)
     */
    formatName(rawName: string): string {
        if (!rawName) return '';
        return rawName.replace(/<[^>]*>?/gm, '');
    }
};