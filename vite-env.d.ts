interface ImportMetaEnv {
  readonly VITE_CAS_API_KEY: string;
  // Adicione outras variáveis de ambiente aqui se necessário
  [key: string]: any;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
