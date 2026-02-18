'use client';

import React, { useEffect, useState } from 'react';
import { Language, localizationService } from '../../../../services/localizationService';
import { LanguageList } from '../../../../components/localization/LanguageList';
import { toast } from '@/hooks/use-toast';
import { GlobeAmericasIcon } from '@heroicons/react/24/outline';

export default function LanguagesPage() {
    const [languages, setLanguages] = useState<Language[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLanguages();
    }, []);

    const loadLanguages = async () => {
        try {
            const data = await localizationService.getLanguages();
            setLanguages(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (code: string, checked: boolean) => {
        // Optimistic update
        setLanguages(prev => prev.map(l => l.code === code ? { ...l, isEnabled: checked } : l));
        try {
            await localizationService.toggleLanguage(code, checked);
            toast({ title: checked ? "Language Enabled" : "Language Disabled" });
        } catch (e) {
            loadLanguages(); // Revert on error
        }
    };

    const handleSetDefault = async (code: string) => {
        // Optimistic update
        setLanguages(prev => prev.map(l => ({ ...l, isDefault: l.code === code })));
        try {
            await localizationService.setAsDefault(code);
            toast({ title: "Default Language Updated" });
        } catch (e) {
            loadLanguages();
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin h-8 w-8 border-2 border-blue-500 rounded-full border-t-transparent"/></div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <GlobeAmericasIcon className="w-8 h-8 text-blue-600" />
                    Languages
                </h1>
                <p className="text-gray-500">Manage the languages supported by your applications.</p>
            </div>

            <LanguageList 
                languages={languages} 
                onToggle={handleToggle}
                onSetDefault={handleSetDefault}
            />
        </div>
    );
}
