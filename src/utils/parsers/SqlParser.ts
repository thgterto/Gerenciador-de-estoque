
/**
 * Parser especializado para strings SQL simples (formato DML/INSERT).
 * Focado na extração de valores de instruções "INSERT INTO ... VALUES (...)".
 */
export const SqlParser = {
    /**
     * Extrai os valores de uma string SQL INSERT.
     * Suporta:
     * - Strings entre aspas simples ('valor')
     * - Números
     * - NULL
     * - Conteúdo multiline
     * 
     * @param sql A string SQL completa ou parcial (ex: "INSERT INTO ... VALUES (1, 'Texto');")
     * @returns Array de valores extraídos ou null se falhar
     */
    parseInsertValues(sql: string): any[] | null {
        if (typeof sql !== 'string') return null;
        
        // Localiza a cláusula VALUES ignorando a definição de colunas anterior
        // O regex [\s\S]* lida com o conteúdo multiline dentro dos parênteses
        const match = sql.match(/VALUES\s*\(([\s\S]*)\)/i);
        if (!match) return null;
        
        let inner = match[1];
        
        // Remove ); do final se houver, ou apenas )
        // Isso é importante para lidar com múltiplos formatos de dump
        inner = inner.replace(/\);\s*$/, '').replace(/\)\s*$/, '');

        const values: any[] = [];
        
        // Regex ajustado para capturar:
        // 1. Strings entre aspas simples (escapando aspas internas se necessário, embora simplificado aqui)
        // 2. Valores fora de aspas (números, NULL, booleanos)
        const regex = /'([^']*)'|([^,]+)/g;
        
        let m;
        while ((m = regex.exec(inner)) !== null) {
            if (m[1] !== undefined) {
                // Grupo 1: Valor string sem aspas
                values.push(m[1]); 
            } else if (m[2]) {
                // Grupo 2: Valor "cru" (número, null, etc)
                const val = m[2].trim();
                if (val.toUpperCase() === 'NULL') {
                    values.push(null);
                } else if (!isNaN(Number(val))) {
                    values.push(Number(val));
                } else {
                    values.push(val);
                }
            }
        }
        
        return values;
    }
};
