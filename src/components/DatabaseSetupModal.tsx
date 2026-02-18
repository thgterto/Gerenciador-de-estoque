
import React from 'react';
import { OrbitalModal } from './ui/orbital/OrbitalModal';
import { CheckSquare, Database } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onSelect: (type: 'EMPTY' | 'DEMO') => void;
}

export const DatabaseSetupModal: React.FC<Props> = ({ isOpen, onSelect }) => {
  return (
    <OrbitalModal isOpen={isOpen} onClose={() => {}} title="" className="max-w-3xl border-orbital-accent/50 shadow-[0_0_50px_rgba(0,243,255,0.15)]">
        {/* Header */}
        <div className="text-center pt-8 pb-4 px-6">
            <div className="inline-flex items-center justify-center size-20 border border-orbital-accent bg-orbital-accent/10 rounded-full mb-6 text-orbital-accent animate-pulse-slow">
                <Database size={40} strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl font-bold text-orbital-text font-display uppercase tracking-widest mb-2">Initialize System</h1>
            <p className="text-orbital-subtext font-mono max-w-md mx-auto">
                Select database initialization protocol.
            </p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8">
            {/* Option 1: Empty */}
            <button 
                onClick={() => onSelect('EMPTY')}
                className="group relative flex flex-col items-center text-center p-8 border border-orbital-border bg-orbital-surface hover:bg-orbital-accent/5 hover:border-orbital-accent transition-all duration-300"
            >
                <div className="size-12 border border-orbital-subtext text-orbital-subtext group-hover:border-orbital-accent group-hover:text-orbital-accent flex items-center justify-center mb-4 transition-colors">
                    <CheckSquare size={24} />
                </div>
                <h3 className="font-bold text-lg text-orbital-text font-display uppercase tracking-wider mb-2">Zero State</h3>
                <p className="text-xs text-orbital-subtext font-mono leading-relaxed mb-6">
                    Initialize empty database structure. Manual entry required.
                </p>
                <span className="px-4 py-2 border border-orbital-border text-xs font-bold font-display uppercase tracking-widest text-orbital-subtext group-hover:bg-orbital-accent group-hover:text-black group-hover:border-orbital-accent transition-all">
                    SELECT EMPTY
                </span>
            </button>

            {/* Option 2: Demo Data */}
            <button 
                onClick={() => onSelect('DEMO')}
                className="group relative flex flex-col items-center text-center p-8 border border-orbital-accent/50 bg-orbital-accent/5 hover:bg-orbital-accent/10 hover:border-orbital-accent transition-all duration-300 shadow-[0_0_20px_rgba(0,243,255,0.05)]"
            >
                <div className="absolute top-3 right-3 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orbital-accent opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-orbital-accent"></span>
                </div>

                <div className="size-12 border border-orbital-accent text-orbital-accent bg-orbital-accent/20 flex items-center justify-center mb-4 transition-colors">
                    <Database size={24} />
                </div>
                <h3 className="font-bold text-lg text-orbital-text font-display uppercase tracking-wider mb-2">Load Sample Data</h3>
                <p className="text-xs text-orbital-subtext font-mono leading-relaxed mb-6">
                    Populate system with LIMS sample dataset (Products, Batches, History).
                </p>
                <span className="px-4 py-2 bg-orbital-accent text-black text-xs font-bold font-display uppercase tracking-widest shadow-[0_0_15px_rgba(0,243,255,0.4)] group-hover:scale-105 transition-all">
                    LOAD DATASET
                </span>
            </button>
        </div>

        {/* Footer */}
        <div className="bg-orbital-bg p-4 text-center border-t border-orbital-border">
            <p className="text-[10px] text-orbital-subtext font-mono uppercase tracking-wider">
                Local Storage Encryption Active
            </p>
        </div>
    </OrbitalModal>
  );
};
