import React from 'react';
import { Language } from '../../services/localizationService';
import { Card } from '../ui/Card';
import { Switch } from '@headlessui/react';
import { StarIcon, TrashIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface LanguageListProps {
    languages: Language[];
    onToggle: (code: string, checked: boolean) => void;
    onSetDefault: (code: string) => void;
}

export const LanguageList: React.FC<LanguageListProps> = ({ languages, onToggle, onSetDefault }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {languages.map((lang) => (
                <Card 
                    key={lang.code} 
                    className={`relative overflow-hidden transition-all border ${
                        lang.isDefault ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50/10' : 'border-gray-200 hover:border-blue-300'
                    }`}
                >
                    <div className="p-5">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl filter drop-shadow-sm">{lang.flag}</span>
                                <div>
                                    <h3 className="font-bold text-gray-900">{lang.name}</h3>
                                    <p className="text-xs text-gray-500 font-medium">{lang.nativeName}</p>
                                </div>
                            </div>
                            <Switch
                                checked={lang.isEnabled}
                                onChange={(checked: boolean) => onToggle(lang.code, checked)}
                                className={`${
                                    lang.isEnabled ? 'bg-blue-600' : 'bg-gray-200'
                                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50`}
                                disabled={lang.isDefault}
                            >
                                <span
                                    className={`${
                                        lang.isEnabled ? 'translate-x-6' : 'translate-x-1'
                                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                />
                            </Switch>
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded">
                                {lang.code}
                            </span>
                            
                            <div className="flex gap-2">
                                <button
                                    onClick={() => !lang.isDefault && onSetDefault(lang.code)}
                                    disabled={!lang.isEnabled || lang.isDefault}
                                    className={`p-1.5 rounded-lg transition-colors ${
                                        lang.isDefault 
                                            ? 'text-yellow-500 bg-yellow-50' 
                                            : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 disabled:opacity-30'
                                    }`}
                                    title={lang.isDefault ? "Default Language" : "Set as Default"}
                                >
                                    {lang.isDefault ? <StarIconSolid className="w-5 h-5" /> : <StarIcon className="w-5 h-5" />}
                                </button>
                                {!lang.isDefault && (
                                    <button className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    {lang.isDefault && (
                        <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                            DEFAULT
                        </div>
                    )}
                </Card>
            ))}
            
            {/* Add New Language Button (Visual Only) */}
            <button className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all group h-full min-h-[160px]">
                <div className="w-12 h-12 rounded-full bg-gray-50 group-hover:bg-blue-100 flex items-center justify-center mb-3 transition-colors">
                    <span className="text-2xl text-gray-300 group-hover:text-blue-500">+</span>
                </div>
                <span className="font-medium">Add Language</span>
            </button>
        </div>
    );
};
