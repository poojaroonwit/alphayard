import React, { useState } from 'react';
import { UserAttribute } from '../../services/userService';
import { Button } from '../ui/Button';
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Input } from '../ui/Input';

interface UserAttributesEditorProps {
    attributes: UserAttribute[];
    onChange: (newAttributes: UserAttribute[]) => void;
}

export const UserAttributesEditor: React.FC<UserAttributesEditorProps> = ({ attributes, onChange }) => {
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');

    const handleAdd = () => {
        if (!newKey.trim()) return;
        onChange([...attributes, { key: newKey, value: newValue }]);
        setNewKey('');
        setNewValue('');
    };

    const handleRemove = (index: number) => {
        const updated = [...attributes];
        updated.splice(index, 1);
        onChange(updated);
    };

    const handleUpdate = (index: number, field: 'key' | 'value', val: string) => {
        const updated = [...attributes];
        updated[index] = { ...updated[index], [field]: val };
        onChange(updated);
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
                {attributes.map((attr, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                        <Input 
                            value={attr.key} 
                            onChange={(e) => handleUpdate(idx, 'key', e.target.value)} 
                            placeholder="Key"
                            className="flex-1 text-sm bg-gray-50 border-gray-200"
                        />
                        <Input 
                            value={attr.value} 
                            onChange={(e) => handleUpdate(idx, 'value', e.target.value)} 
                            placeholder="Value"
                            className="flex-1 text-sm bg-gray-50 border-gray-200"
                        />
                        <button onClick={() => handleRemove(idx)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>
                ))}
            </div>

            <div className="flex gap-2 items-center pt-2 border-t border-dashed border-gray-200">
                <Input 
                    value={newKey} 
                    onChange={(e) => setNewKey(e.target.value)} 
                    placeholder="New Attribute Key"
                    className="flex-1 text-sm bg-white"
                />
                <Input 
                    value={newValue} 
                    onChange={(e) => setNewValue(e.target.value)} 
                    placeholder="Value"
                    className="flex-1 text-sm bg-white"
                />
                <Button onClick={handleAdd} disabled={!newKey} variant="secondary" className="px-3" title="Add Attribute">
                    <PlusIcon className="w-5 h-5" />
                </Button>
            </div>
        </div>
    );
};
