import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations as defaultTranslations, TranslationKey } from '../i18n/translations';

type Language = 'en' | 'th' | null;

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => Promise<void>;
    isLoading: boolean;
    t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>(null);
    const [translations, setTranslations] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);

    // Initial load
    useEffect(() => {
        const loadLanguage = async () => {
            try {
                const storedLang = await AsyncStorage.getItem('app_language');
                if (storedLang === 'en' || storedLang === 'th') {
                    setLanguageState(storedLang as Language);
                } else {
                    // Default to English if not set
                    setLanguageState('en');
                }
            } catch (error) {
                console.error('Failed to load language', error);
                setLanguageState('en');
            } finally {
                setIsLoading(false);
            }
        };
        loadLanguage();
    }, []);

    // Load translations when language changes
    useEffect(() => {
        if (!language) return;

        const loadTranslations = async () => {
            // 1. Load from local fallback first
            const localTranslations = defaultTranslations[language];
            setTranslations(localTranslations);

            // 2. Attempt to fetch from API (if backend is ready)
            try {
                // TODO: Replace with actual API call once endpoint is verified
                // const response = await api.get(`/translations?lang=${language}`);
                // if (response.data) {
                //    setTranslations(prev => ({ ...prev, ...response.data }));
                // }
            } catch (error) {
                console.warn('Failed to fetch remote translations, using local fallback');
            }
        };

        loadTranslations();
    }, [language]);

    const setLanguage = async (lang: Language) => {
        try {
            if (lang) {
                await AsyncStorage.setItem('app_language', lang);
            } else {
                await AsyncStorage.removeItem('app_language');
            }
            setLanguageState(lang);
        } catch (error) {
            console.error('Failed to save language', error);
        }
    };

    const t = (key: TranslationKey): string => {
        return translations[key] || defaultTranslations['en'][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, isLoading, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
