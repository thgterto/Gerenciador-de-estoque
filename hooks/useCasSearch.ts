
import { useState } from 'react';
import { CasApiService } from '../services/CasApiService';
import { useAlert } from '../context/AlertContext';
import { CasDataDTO, RiskFlags, CreateItemDTO } from '../types';
import { sanitizeProductName } from '../utils/stringUtils';

export const useCasSearch = () => {
    const { addToast } = useAlert();
    const [isCasLoading, setIsCasLoading] = useState(false);
    const [casResult, setCasResult] = useState<CasDataDTO | null>(null);

    const searchCas = async (casNumber: string | undefined) => {
        if (!casNumber || casNumber.length < 4) {
            addToast('Atenção', 'warning', 'Digite um número CAS válido.');
            return null;
        }
        setIsCasLoading(true);
        try {
            const data = await CasApiService.fetchChemicalData(casNumber);
            if (data) {
                setCasResult(data);
                const suggestedRisks = CasApiService.analyzeRisks(data);

                addToast('Dados Encontrados', 'success', `CAS: ${data.rn}`);
                return {
                    name: sanitizeProductName(CasApiService.formatName(data.name)),
                    molecularFormula: data.molecularFormula,
                    molecularWeight: data.molecularMass,
                    risks: suggestedRisks
                };
            } else {
                addToast('Não Encontrado', 'info', 'CAS não localizado.');
            }
        } catch (e) {
            addToast('Erro', 'error', 'Falha ao buscar dados CAS.');
        } finally {
            setIsCasLoading(false);
        }
        return null;
    };

    return {
        isCasLoading,
        casResult,
        setCasResult,
        searchCas
    };
};
