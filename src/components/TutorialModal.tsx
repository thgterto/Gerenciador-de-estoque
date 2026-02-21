
import React, { useState, useEffect, useLayoutEffect } from 'react';
import { OrbitalButton } from './ui/orbital/OrbitalButton';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  setTab: (tab: string) => void;
}

interface Step {
  targetId?: string; 
  mobileTargetId?: string;
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

  const steps: Step[] = [
    {
      title: "SYSTEM INITIALIZED",
      desc: "Welcome to LabControl. This orbital interface is designed for high-efficiency inventory management.",
      position: 'center'
    },
    {
      targetId: 'tour-sidebar',
      mobileTargetId: 'tour-mobile-nav',
      title: "NAVIGATION ARRAY",
      desc: "Access core modules: Inventory, Audit Logs, Storage Matrix, and Purchase Planning.",
      position: 'right'
    },
    {
      targetId: 'tour-kpi',
      title: "TELEMETRY",
      desc: "Real-time metrics on system health, critical items, and operational efficiency.",
      position: 'bottom',
      forceTab: 'dashboard'
    },
    {
      targetId: 'tour-inv-filters',
      title: "QUERY PARAMETERS",
      desc: "Filter data streams by Batch, SKU, Location, or Category for rapid retrieval.",
      position: 'bottom',
      forceTab: 'inventory'
    },
    {
      targetId: 'tour-storage-grid',
      title: "SPATIAL MAPPING",
      desc: "Visual representation of physical storage units. Manage capacity and compatibility.",
      position: 'right', 
      forceTab: 'storage'
    },
    {
      targetId: 'tour-audit-btn',
      title: "COMPLIANCE MODE",
      desc: "Activate inspection overlays to identify expired items or hazardous storage violations.",
      position: 'bottom',
      forceTab: 'storage'
    },
    {
      targetId: 'tour-purchases-export',
      title: "ACQUISITION LOGIC",
      desc: "Automated replenishment calculations based on consumption velocity.",
      position: 'left',
      forceTab: 'purchases'
    },
    {
      targetId: 'tour-add-btn',
      title: "COMMAND FUNCTIONS",
      desc: "Execute item creation, manual backups, and system alerts.",
      position: 'bottom',
      forceTab: 'dashboard'
    },
    {
      title: "CONFIGURATION",
      desc: "Import legacy datasets, manage backups, or re-initialize this tutorial sequence.",
      position: 'center',
      forceTab: 'settings'
    },
    {
      title: "SYSTEM READY",
      desc: "Initialization complete. You have control.",
      position: 'center'
    }
  ];

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const updatePosition = () => {
    const step = steps[currentStep];

    if (step.forceTab) {
        setTab(step.forceTab);
        setTimeout(() => calculateLayout(step), 450); 
    } else {
        calculateLayout(step);
    }
  };

  const calculateLayout = (step: Step) => {
    const targetId = (isMobile && step.mobileTargetId) ? step.mobileTargetId : step.targetId;

    if (!targetId) {
        setSpotlightStyle({
            top: '50%',
            left: '50%',
            width: 0,
            height: 0,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.85)',
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

            setSpotlightStyle({
                top: rect.top - padding,
                left: rect.left - padding,
                width: rect.width + (padding * 2),
                height: rect.height + (padding * 2),
                borderRadius: '0px',
                position: 'fixed',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.85)',
                zIndex: 100,
                opacity: 1,
                pointerEvents: 'none',
                border: '1px solid rgba(0, 243, 255, 0.5)',
                transition: 'all 0.5s ease-in-out'
            });

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
        setSpotlightStyle({
            top: '50%',
            left: '50%',
            width: 0,
            height: 0,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.85)',
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
          // eslint-disable-next-line
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
    <div className="fixed inset-0 z-[100] overflow-hidden font-sans">
        {/* Spotlight Effect */}
        <div 
            className="absolute transition-all duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] pointer-events-none"
            style={spotlightStyle}
        />

        {/* Content Card */}
        <div 
            className={`
                bg-orbital-surface border border-orbital-accent shadow-[0_0_30px_rgba(0,243,255,0.1)]
                flex flex-col transition-all duration-500 ease-out
                ${isReady ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
                max-h-[90vh] overflow-y-auto custom-scrollbar
            `}
            style={tooltipStyle}
        >
            <div className="h-0.5 bg-orbital-accent w-full shadow-[0_0_10px_rgba(0,243,255,0.5)]"></div>
            
            <div className="p-6">
                <div className="flex justify-between items-center mb-5">
                     <span className="text-[10px] font-bold text-orbital-accent bg-orbital-accent/5 border border-orbital-accent/20 px-2.5 py-1 uppercase tracking-wider font-display">
                        Sequence {currentStep + 1} / {steps.length}
                    </span>
                    <button onClick={handleFinish} className="text-orbital-subtext hover:text-orbital-accent transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <h3 className="text-lg font-bold text-orbital-text mb-2 leading-tight font-display uppercase tracking-wide">
                    {steps[currentStep].title}
                </h3>
                
                <p className="text-orbital-subtext text-sm leading-relaxed mb-6 font-mono">
                    {steps[currentStep].desc}
                </p>

                <div className="flex justify-between items-center gap-3 mt-auto">
                    {currentStep > 0 ? (
                        <OrbitalButton
                            variant="secondary"
                            onClick={handlePrev}
                            className="w-auto"
                        >
                            <ArrowLeft size={14} className="mr-1"/> BACK
                        </OrbitalButton>
                    ) : (
                         <div className="flex-1"></div>
                    )}

                    <OrbitalButton
                        variant="primary"
                        onClick={handleNext}
                        className="w-auto"
                    >
                        {currentStep === steps.length - 1 ? 'ENGAGE' : 'NEXT'}
                        {currentStep < steps.length - 1 && <ArrowRight size={14} className="ml-1"/>}
                    </OrbitalButton>
                </div>

                <div className="mt-5 pt-4 border-t border-orbital-border flex justify-center">
                    <label className="flex items-center gap-2 cursor-pointer group select-none opacity-80 hover:opacity-100 transition-opacity">
                        <input 
                            type="checkbox" 
                            className="appearance-none w-3.5 h-3.5 border border-orbital-border bg-orbital-bg checked:bg-orbital-accent checked:border-orbital-accent focus:ring-0 transition-colors"
                            checked={dontShowAgain}
                            onChange={(e) => setDontShowAgain(e.target.checked)}
                        />
                        <span className="text-[10px] font-mono font-medium text-orbital-subtext group-hover:text-orbital-accent transition-colors uppercase tracking-wider">
                            Disable future guidance
                        </span>
                    </label>
                </div>
            </div>
        </div>
    </div>
  );
};
