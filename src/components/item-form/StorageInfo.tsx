import React from 'react';
import { OrbitalCard } from '../ui/orbital/OrbitalCard';
import { OrbitalInput } from '../ui/orbital/OrbitalInput';
import { StorageAddress } from '../../types';
import { MapPin } from 'lucide-react';

interface StorageInfoProps {
    location: StorageAddress;
    onChange: (field: string, value: string) => void;
    errors: Record<string, string>;
}

export const StorageInfo: React.FC<StorageInfoProps> = ({ location, onChange, errors }) => {
    return (
        <OrbitalCard>
            <div className="flex items-center gap-2 mb-4 text-orbital-subtext border-b border-orbital-border pb-2">
                <MapPin size={18} />
                <h4 className="font-bold text-sm uppercase tracking-wide">Armazenamento</h4>
            </div>

            <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <OrbitalInput
                        label="Armazém / Sala"
                        required
                        placeholder="Ex: Geral"
                        value={location?.warehouse || ''}
                        onChange={e => onChange('location.warehouse', e.target.value)}
                        error={errors['location.warehouse']}
                    />
                    <OrbitalInput
                        label="Armário / Geladeira"
                        value={location?.cabinet || ''}
                        onChange={e => onChange('location.cabinet', e.target.value)}
                        placeholder="Ex: Inflamáveis"
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <OrbitalInput
                        label="Prateleira"
                        value={location?.shelf || ''}
                        onChange={e => onChange('location.shelf', e.target.value)}
                    />
                    <OrbitalInput
                        label="Posição (Grid)"
                        value={location?.position || ''}
                        onChange={e => onChange('location.position', e.target.value)}
                        placeholder="Ex: A1"
                    />
                </div>
            </div>
        </OrbitalCard>
    );
};
