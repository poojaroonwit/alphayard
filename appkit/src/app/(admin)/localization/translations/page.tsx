'use client';

import React, { useEffect, useState } from 'react';
import { TranslationKey, Language, localizationService } from '../../../../services/localizationService';
import { TranslationTable } from '../../../../components/localization/TranslationTable';
import { ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline';
import { toast } from '@/hooks/use-toast';

export default function TranslationsPage() {
    const [keys, setKeys] = useState<TranslationKey[]>([]);
    const [languages, setLanguages] = useState<Language[]>([]);
    const [targetLang, setTargetLang] = useState<string>('fr-FR');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [k, l] = await Promise.all([
                localizationService.getTranslations(),
                localizationService.getLanguages()
            ]);
            setKeys(k);
            setLanguages(l);
            // Default to first non-default enabled language if available
            const preferred = l.find(x => !x.isDefault && x.isEnabled);
            if (preferred) setTargetLang(preferred.code);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (keyId: string, value: string) => {
        // Optimistic
        setKeys(prev => prev.map(k => {
            if (k.id === keyId) {
                return { ...k, translations: { ...k.translations, [targetLang]: value } };
            }
            return k;
        }));

        try {
            await localizationService.updateTranslation(keyId, targetLang, value);
            toast({ title: "Translation Saved", description: "Changes persisted." });
        } catch (e) {
            loadData(); // Revert
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin h-8 w-8 border-2 border-blue-500 rounded-full border-t-transparent"/></div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <ChatBubbleBottomCenterTextIcon className="w-8 h-8 text-blue-600" />
                        Translations
                    </h1>
                    <p className="text-gray-500">Edit translation strings for your enabled languages.</p>
                </div>
                
                <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200">
                    <span className="text-sm font-medium text-gray-500 px-2">Translate to:</span>
                    <select 
                        value={targetLang} 
                        onChange={(e) => setTargetLang(e.target.value)}
                        className="bg-gray-50 border-transparent rounded-md text-sm font-medium focus:ring-2 focus:ring-blue-500 py-1.5 pl-3 pr-8"
                    >
                        {languages.filter(l => !l.isDefault).map(l => ( // Exclude default (English) from target
                            <option key={l.code} value={l.code}>
                                {l.flag} {l.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <TranslationTable 
                keys={keys} 
                targetLanguage={targetLang} 
                languages={languages}
                onUpdate={handleUpdate}
            />
        </div>
    );
}
