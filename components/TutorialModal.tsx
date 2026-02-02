
import React, { useState, useEffect, useLayoutEffect } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  setTab: (tab: string) => void;
}

interface Step {
  targetId?: string; 
  mobileTargetId?: string; // Alvo alternativo para mobile
  title: string;
  desc: string;
  position?: 'right' | 'bottom' | 'left' | 'center' | 'top';
  forceTab?: string;
}

export const TutorialModal: React.FC<Props> = ({ isOpen, onClose, setTab }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [spotlightStyle, setSpotlightStyle] = useState<React.CSSProperties>({});
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [isReady, setIsReady] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Definição dos Passos do Tour (Atualizado com UX Writing Comercial)
  const steps: Step[] = [
    {
      title: "Boas-vindas ao LabControl",
      desc: "Descubra em 1 minuto como simplificar sua gestão laboratorial. Otimize tempo, reduza perdas e garanta a conformidade do seu estoque.",
      position: 'center'
    },
    {
      targetId: 'tour-sidebar',
      mobileTargetId: 'tour-mobile-nav',
      title: "Navegação Centralizada",
      desc: "Acesso rápido a todos os módulos essenciais: Inventário, Histórico de Auditoria, Matriz de Armazenamento e Planejamento de Compras.",
      position: 'right'
    },
    {
      targetId: 'tour-kpi',
      title: "Visão Estratégica (KPIs)",
      desc: "Monitore a saúde do seu laboratório em tempo real. Identifique gargalos, itens críticos e oportunidades de reposição instantaneamente.",
      position: 'bottom',
      forceTab: 'dashboard'
    },
    {
      targetId: 'tour-inv-filters',
      title: "Busca Inteligente & Filtros",
      desc: "Localize qualquer insumo em segundos cruzando dados de Lote, SKU, Localização e Categoria. Ideal para auditorias rápidas.",
      position: 'bottom',
      forceTab: 'inventory'
    },
    {
      targetId: 'tour-storage-grid',
      title: "Mapeamento Físico",
      desc: "Gerencie visualmente a ocupação de geladeiras e armários. Evite a superlotação e organize itens por compatibilidade.",
      position: 'right', 
      forceTab: 'storage'
    },
    {
      targetId: 'tour-audit-btn',
      title: "Compliance (Auditoria)",
      desc: "Ative o modo de inspeção para destacar visualmente inconformidades, como itens vencidos ou riscos químicos (GHS) armazenados incorretamente.",
      position: 'bottom',
      forceTab: 'storage'
    },
    {
      targetId: 'tour-purchases-export',
      title: "Gestão de Aquisições",
      desc: "Automatize sua lista de reposição baseada em consumo real. Exporte pedidos prontos para o departamento de compras com um clique.",
      position: 'left',
      forceTab: 'purchases'
    },
    {
      targetId: 'tour-add-btn',
      title: "Menu de Ação Rápida",
      desc: "Atalhos de produtividade: Adicione novos itens, realize backups de segurança manuais e verifique notificações do sistema.",
      position: 'bottom',
      forceTab: 'dashboard'
    },
    {
      title: "Personalização & Dados",
      desc: "Acesse as Configurações para importar planilhas legadas, gerenciar backups ou reativar este guia interativo quando precisar.",
      position: 'center',
      forceTab: 'settings'
    },
    {
      title: "Tudo Pronto!",
      desc: "Você está no controle. Mantenha seu inventário atualizado para extrair o máximo de inteligência do sistema.",
      position: 'center'
    }
  ];

  // Detect Mobile Resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const updatePosition = () => {
    const step = steps[currentStep];

    if (step.forceTab) {
        setTab(step.forceTab);
        // Delay para permitir renderização e animação de troca de aba
        setTimeout(() => calculateLayout(step), 450); 
    } else {
        calculateLayout(step);
    }
  };

  const calculateLayout = (step: Step) => {
    const targetId = (isMobile && step.mobileTargetId) ? step.mobileTargetId : step.targetId;

    if (!targetId) {
        // Centralizado
        setSpotlightStyle({
            top: '50%',
            left: '50%',
            width: 0,
            height: 0,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)',
            opacity: 0 
        });
        setTooltipStyle({
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            position: 'fixed',
            width: isMobile ? '90%' : '420px',
            maxWidth: '420px'
        });
        setIsReady(true);
        return;
    }

    const element = document.getElementById(targetId);
    
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });

        setTimeout(() => {
            const rect = element.getBoundingClientRect();
            const padding = isMobile ? 8 : 12;

            // Spotlight (Holofote)
            setSpotlightStyle({
                top: rect.top - padding,
                left: rect.left - padding,
                width: rect.width + (padding * 2),
                height: rect.height + (padding * 2),
                borderRadius: '12px',
                position: 'fixed',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)',
                zIndex: 100,
                opacity: 1,
                pointerEvents: 'none',
                transition: 'all 0.5s ease-in-out'
            });

            // Tooltip Position Logic
            let toolTop = 0;
            let toolLeft = 0;
            let transform = '';
            const tooltipWidth = 340;
            const gap = 24;

            if (isMobile) {
                const spaceAbove = rect.top;
                const spaceBelow = window.innerHeight - rect.bottom;
                
                toolLeft = window.innerWidth / 2;
                transform = 'translateX(-50%)';

                if (spaceBelow > 220 || spaceBelow > spaceAbove) {
                     toolTop = rect.bottom + gap;
                } else {
                     toolTop = rect.top - gap;
                     transform = 'translate(-50%, -100%)';
                }

                setTooltipStyle({
                    top: toolTop,
                    left: toolLeft,
                    transform: transform,
                    position: 'fixed',
                    width: '90%', 
                    maxWidth: '360px',
                    zIndex: 101,
                });
            } else {
                // Desktop
                switch (step.position) {
                    case 'right':
                        toolTop = rect.top + (rect.height / 2);
                        toolLeft = rect.right + gap;
                        transform = 'translateY(-50%)';
                        break;
                    case 'left':
                        toolTop = rect.top + (rect.height / 2);
                        toolLeft = rect.left - tooltipWidth - gap;
                        transform = 'translateY(-50%)';
                        break;
                    case 'bottom':
                        toolTop = rect.bottom + gap;
                        toolLeft = rect.left + (rect.width / 2);
                        transform = 'translateX(-50%)';
                        break;
                    case 'top':
                        toolTop = rect.top - gap;
                        toolLeft = rect.left + (rect.width / 2);
                        transform = 'translate(-50%, -100%)';
                        break;
                    default: 
                        toolTop = window.innerHeight / 2;
                        toolLeft = window.innerWidth / 2;
                        transform = 'translate(-50%, -50%)';
                }

                // Boundary Checks
                if (toolLeft + (tooltipWidth/2) > window.innerWidth) {
                    toolLeft = window.innerWidth - tooltipWidth - 20;
                    if (step.position === 'bottom' || step.position === 'top') {
                        transform = step.position === 'top' ? 'translateY(-100%)' : 'none';
                    }
                }
                if (toolLeft < 0) {
                    toolLeft = 20;
                    if (step.position === 'bottom' || step.position === 'top') {
                        transform = step.position === 'top' ? 'translateY(-100%)' : 'none';
                    }
                }

                setTooltipStyle({
                    top: toolTop,
                    left: toolLeft,
                    transform: transform,
                    position: 'fixed',
                    width: `${tooltipWidth}px`,
                    zIndex: 101,
                });
            }
            setIsReady(true);
        }, 500);
    } else {
        // Fallback
        setSpotlightStyle({
            top: '50%',
            left: '50%',
            width: 0,
            height: 0,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)',
            opacity: 0
        });
        setTooltipStyle({
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            position: 'fixed',
            width: isMobile ? '90%' : '350px'
        });
        setIsReady(true);
    }
  };

  useLayoutEffect(() => {
      if (isOpen) {
          setIsReady(false);
          updatePosition();
          window.addEventListener('resize', updatePosition);
          return () => {
              window.removeEventListener('resize', updatePosition);
          };
      }
  }, [currentStep, isOpen]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleFinish = () => {
    if (dontShowAgain) {
      localStorage.setItem('LC_TUTORIAL_SEEN', 'true');
    }
    onClose();
    setTimeout(() => setCurrentStep(0), 500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
        {/* Spotlight Effect */}
        <div 
            className="absolute transition-all duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] pointer-events-none"
            style={spotlightStyle}
        />

        {/* Content Card */}
        <div 
            className={`bg-surface-light dark:bg-surface-dark rounded-xl shadow-2xl border border-border-light dark:border-border-dark flex flex-col transition-all duration-500 ease-out ${isReady ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} max-h-[90vh] overflow-y-auto custom-scrollbar`}
            style={tooltipStyle}
        >
            <div className="h-1.5 bg-gradient-to-r from-primary to-primary-hover w-full rounded-t-xl"></div>
            
            <div className="p-6">
                <div className="flex justify-between items-center mb-5">
                     <span className="text-[10px] font-bold text-primary bg-primary/5 border border-primary/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                        Dica {currentStep + 1} de {steps.length}
                    </span>
                    <button onClick={handleFinish} className="text-text-light hover:text-text-secondary dark:text-gray-500 dark:hover:text-gray-300 transition-colors">
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                <h3 className="text-lg font-bold text-text-main dark:text-white mb-2 leading-tight">
                    {steps[currentStep].title}
                </h3>
                
                <p className="text-text-secondary dark:text-gray-300 text-sm leading-relaxed mb-6 font-medium">
                    {steps[currentStep].desc}
                </p>

                <div className="flex justify-between items-center gap-3 mt-auto">
                    {currentStep > 0 ? (
                        <button 
                            onClick={handlePrev}
                            className="text-text-secondary dark:text-gray-300 hover:text-text-main dark:hover:text-white text-sm font-bold px-4 py-2 transition-colors rounded-lg hover:bg-background-light dark:hover:bg-slate-700"
                        >
                            Voltar
                        </button>
                    ) : (
                         <div className="flex-1"></div>
                    )}

                    <button 
                        onClick={handleNext}
                        className="bg-primary hover:bg-primary-hover text-white text-sm font-bold px-6 py-2.5 rounded-lg shadow-md shadow-primary/20 transition-all active:scale-95 flex items-center gap-2"
                    >
                        {currentStep === steps.length - 1 ? 'Começar Agora' : 'Próximo'}
                        {currentStep < steps.length - 1 && <span className="material-symbols-outlined text-[16px]">arrow_forward</span>}
                    </button>
                </div>

                <div className="mt-5 pt-4 border-t border-border-light dark:border-border-dark flex justify-center">
                    <label className="flex items-center gap-2 cursor-pointer group select-none opacity-80 hover:opacity-100 transition-opacity">
                        <input 
                            type="checkbox" 
                            className="rounded border-border-light dark:border-gray-600 text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer dark:bg-slate-800"
                            checked={dontShowAgain}
                            onChange={(e) => setDontShowAgain(e.target.checked)}
                        />
                        <span className="text-[11px] font-medium text-text-secondary dark:text-gray-400 group-hover:text-primary transition-colors">
                            Não mostrar novamente
                        </span>
                    </label>
                </div>
            </div>
        </div>
    </div>
  );
};
