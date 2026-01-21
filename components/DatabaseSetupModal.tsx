
import React from 'react';
import { Modal } from './ui/Modal';

interface Props {
  isOpen: boolean;
  onSelect: (type: 'EMPTY' | 'DEMO') => void;
}

export const DatabaseSetupModal: React.FC<Props> = ({ isOpen, onSelect }) => {
  return (
    <Modal isOpen={isOpen} hideHeader className="max-w-2xl">
        {/* Header */}
        <div className="text-center pt-8 pb-4 px-6">
            <div className="inline-flex items-center justify-center size-16 bg-primary/10 rounded-full mb-4 text-primary">
                <span className="material-symbols-outlined text-4xl">science</span>
            </div>
            <h1 className="text-2xl font-black text-text-main dark:text-white tracking-tight">Bem-vindo ao LabControl</h1>
            <p className="text-text-secondary dark:text-gray-400 mt-2 max-w-md mx-auto">
                Para começar, escolha como deseja iniciar seu banco de dados de inventário.
            </p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8">
            {/* Option 1: Empty */}
            <button 
                onClick={() => onSelect('EMPTY')}
                className="group relative flex flex-col items-center text-center p-6 rounded-xl border-2 border-dashed border-border-light dark:border-border-dark hover:border-secondary hover:bg-secondary/5 dark:hover:bg-secondary/10 transition-all duration-300"
            >
                <div className="size-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-gray-400 group-hover:bg-white dark:group-hover:bg-slate-700 group-hover:text-secondary flex items-center justify-center mb-3 transition-colors shadow-sm">
                    <span className="material-symbols-outlined text-2xl">check_box_outline_blank</span>
                </div>
                <h3 className="font-bold text-lg text-text-main dark:text-white mb-1">Começar do Zero</h3>
                <p className="text-sm text-text-secondary dark:text-gray-400 leading-relaxed">
                    Inicie com um banco de dados limpo para cadastrar seus próprios itens e movimentações desde o início.
                </p>
                <span className="mt-4 px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-border-light dark:border-border-dark text-sm font-bold text-text-secondary dark:text-gray-300 group-hover:border-secondary group-hover:text-secondary transition-all shadow-sm">
                    Selecionar Vazio
                </span>
            </button>

            {/* Option 2: Demo Data */}
            <button 
                onClick={() => onSelect('DEMO')}
                className="group relative flex flex-col items-center text-center p-6 rounded-xl border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary transition-all duration-300"
            >
                <div className="absolute top-3 right-3">
                    <span className="flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                    </span>
                </div>
                <div className="size-12 rounded-full bg-white dark:bg-slate-800 text-primary flex items-center justify-center mb-3 shadow-sm">
                    <span className="material-symbols-outlined text-2xl">dataset</span>
                </div>
                <h3 className="font-bold text-lg text-text-main dark:text-white mb-1">Dados LIMS (Real)</h3>
                <p className="text-sm text-text-secondary dark:text-gray-400 leading-relaxed">
                    Carregue a base de dados consolidada do sistema legado (LIMS) com produtos, lotes e histórico.
                </p>
                <span className="mt-4 px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold shadow-md shadow-primary/20 group-hover:scale-105 transition-all">
                    Carregar Dados
                </span>
            </button>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 text-center border-t border-border-light dark:border-border-dark">
            <p className="text-xs text-text-secondary dark:text-gray-500 flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-[14px]">lock</span>
                Seus dados são armazenados localmente no navegador.
            </p>
        </div>
    </Modal>
  );
};
