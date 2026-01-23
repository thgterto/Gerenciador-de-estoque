
import React from 'react';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { StorageAddress } from '../../types';

interface StorageInfoProps {
    location: StorageAddress;
    onChange: (field: string, value: string) => void;
    errors: Record<string, string>;
}

export const StorageInfo: React.FC<StorageInfoProps> = ({ location, onChange, errors }) => {
    return (
        <Card noBorder className="shadow-sm border border-border-light dark:border-border-dark" padding="p-5">
            <div className="flex items-center gap-2 mb-4 border-b border-border-light dark:border-border-dark pb-2">
                <span className="material-symbols-outlined text-text-secondary text-[20px]">location_on</span>
                <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary dark:text-gray-400">Armazenamento</h3>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                        <Input
                        label="Armazém / Sala"
                        required
                        placeholder="Ex: Geral"
                        value={location?.warehouse || ''}
                        onChange={e => onChange('location.warehouse', e.target.value)}
                        error={errors['location.warehouse']}
                    />
                    <Input
                        label="Armário / Geladeira"
                        value={location?.cabinet || ''}
                        onChange={e => onChange('location.cabinet', e.target.value)}
                        placeholder="Ex: Inflamáveis"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Prateleira"
                        value={location?.shelf || ''}
                        onChange={e => onChange('location.shelf', e.target.value)}
                    />
                    <Input
                        label="Posição (Grid)"
                        value={location?.position || ''}
                        onChange={e => onChange('location.position', e.target.value)}
                        placeholder="Ex: A1"
                    />
                </div>
            </div>
        </Card>
    );
};
