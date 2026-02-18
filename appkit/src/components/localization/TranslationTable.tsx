import React, { useState } from 'react';
import { TranslationKey, Language } from '../../services/localizationService';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { MagnifyingGlassIcon, CheckIcon } from '@heroicons/react/24/outline';

interface TranslationTableProps {
    keys: TranslationKey[];
    targetLanguage: string; // code
    languages: Language[];
    onUpdate: (keyId: string, value: string) => void;
}

export const TranslationTable: React.FC<TranslationTableProps> = ({ keys, targetLanguage, languages, onUpdate }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [tempValue, setTempValue] = useState('');

    const targetLangName = languages.find(l => l.code === targetLanguage)?.name || targetLanguage;

    const filteredKeys = keys.filter(k => 
        k.key.toLowerCase().includes(searchTerm.toLowerCase()) || 
        k.defaultValue.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const startEdit = (key: TranslationKey) => {
        setEditingId(key.id);
        setTempValue(key.translations[targetLanguage] || '');
    };

    const saveEdit = (keyId: string) => {
        onUpdate(keyId, tempValue);
        setEditingId(null);
    };

    return (
        <Card className="overflow-hidden border border-gray-200 shadow-sm rounded-xl">
            <div className="p-4 border-b border-gray-100 bg-white flex justify-between items-center">
                <div className="relative w-72">
                    <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input 
                        placeholder="Search keywords..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        className="pl-10 bg-gray-50 border-gray-200"
                    />
                </div>
                <div className="text-sm text-gray-500">
                    Editing: <span className="font-bold text-gray-900">{targetLangName}</span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3 font-medium w-1/3">Keyword & Default (English)</th>
                            <th className="px-6 py-3 font-medium">Translation ({targetLanguage})</th>
                            <th className="px-6 py-3 font-medium w-20">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredKeys.map(key => {
                            const hasTranslation = !!key.translations[targetLanguage];
                            const isEditing = editingId === key.id;

                            return (
                                <tr key={key.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 align-top">
                                        <div className="font-mono text-xs text-blue-600 mb-1">{key.key}</div>
                                        <div className="text-gray-900 font-medium">{key.defaultValue}</div>
                                        {key.description && <div className="text-xs text-gray-400 mt-1">{key.description}</div>}
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        {isEditing ? (
                                            <div className="flex gap-2">
                                                <textarea 
                                                    className="w-full p-2 border border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-sm"
                                                    rows={2}
                                                    value={tempValue}
                                                    onChange={(e) => setTempValue(e.target.value)}
                                                    autoFocus
                                                    onBlur={() => saveEdit(key.id)} // Auto-save on blur
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault();
                                                            saveEdit(key.id);
                                                        }
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <div 
                                                onClick={() => startEdit(key)}
                                                className={`p-3 rounded-lg border border-dashed cursor-text min-h-[50px] transition-colors ${
                                                    hasTranslation 
                                                        ? 'border-gray-200 text-gray-900 bg-white hover:border-gray-300' 
                                                        : 'border-yellow-300 bg-yellow-50/50 text-gray-400 italic hover:border-yellow-400'
                                                }`}
                                            >
                                                {key.translations[targetLanguage] || 'Click to add translation...'}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 align-top text-center">
                                        {hasTranslation ? (
                                            <div className="mt-2 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto">
                                                <CheckIcon className="w-4 h-4" />
                                            </div>
                                        ) : (
                                            <div className="mt-2 w-2 h-2 rounded-full bg-orange-300 mx-auto" title="Missing" />
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};
