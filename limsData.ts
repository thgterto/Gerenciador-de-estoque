
// Structured to match the Hybrid DatabaseSeeder expectations
export const LIMS_DATA: any = {
  "metadata": {
    "gerado_em": "2025-12-23 14:15:23.151393",
    "status": "REAL DATA (SANITIZED)"
  },
  "dml": {
    "produtos": [
      "INSERT INTO produtos VALUES ('10017228', 'CARTUCHO CONTRA VAPORES ORGÂNICOS', 'UN');",
      "INSERT INTO produtos VALUES ('100857', 'KIT TESTE ANÁLISE SÍLICA ALTA 1.1-107MG/L', 'ML');",
      "INSERT INTO produtos VALUES ('204813', 'ÁCIDO CLORÍDRICO', 'ML');",
      "INSERT INTO produtos VALUES ('212922', 'ÁCIDO SULFÚRICO PA', 'ML');",
      "INSERT INTO produtos VALUES ('229707', 'HIDRÓXIDO DE SÓDIO EM PÉROLAS PA', 'G');"
    ],
    "lotes": [
        // Using Object format for robustness as seen in LIMS_real_data.json
        { "cdsap": "10017228", "lote": "GEN", "fabricante": "GENERICO", "validade": null },
        { "cdsap": "204813", "lote": "13564", "fabricante": "GENERICO", "validade": null },
        { "cdsap": "212922", "lote": "12108", "fabricante": "GENERICO", "validade": null },
        { "cdsap": "229707", "lote": "213694", "fabricante": "SYNTH", "validade": "2025-12-31" }
    ],
    "movimentacoes": [
      {
        "id_mov": 1,
        "tipo_mov": "ENTRADA",
        "data_mov": "2023-01-10",
        "quantidade": 100.0,
        "cdsap": "10017228",
        "lote": "GEN"
      },
      {
        "id_mov": 2,
        "tipo_mov": "SAIDA",
        "data_mov": "2023-03-10",
        "quantidade": 5.0,
        "cdsap": "204813",
        "lote": "13564"
      }
    ]
  }
};