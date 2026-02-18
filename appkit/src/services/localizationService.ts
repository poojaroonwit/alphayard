
export interface Language {
    code: string; // e.g., 'en-US'
    name: string; // e.g., 'English (US)'
    nativeName: string; // e.g., 'English'
    isDefault: boolean;
    isEnabled: boolean;
    flag: string; // Emoji
}

export interface TranslationKey {
    id: string;
    key: string;
    description?: string;
    defaultValue: string; // English
    translations: Record<string, string>; // keyed by lang code
}

let translationKeys: TranslationKey[] = [
    { 
        id: '1', 
        key: 'common.save', 
        description: 'Save button label', 
        defaultValue: 'Save', 
        translations: { 'th-TH': 'บันทึก', 'ja-JP': '保存' } 
    },
    { 
        id: '2', 
        key: 'common.cancel', 
        description: 'Cancel button label', 
        defaultValue: 'Cancel', 
        translations: { 'th-TH': 'ยกเลิก', 'ja-JP': 'キャンセル' } 
    },
    { 
        id: '3', 
        key: 'nav.dashboard', 
        description: 'Dashboard navigation link', 
        defaultValue: 'Dashboard', 
        translations: { 'th-TH': 'แดชบอร์ด', 'ja-JP': 'ダッシュボード' } 
    }
];

export interface Region {
    id: string;
    code: string; // e.g., 'US', 'EU'
    name: string; // e.g., 'United States'
    currency: string; // e.g., 'USD'
    isEnabled: boolean;
}

// ... existing mock data ...

let regions: Region[] = [
    { id: '1', code: 'US', name: 'United States', currency: 'USD', isEnabled: true },
    { id: '2', code: 'EU', name: 'Europe', currency: 'EUR', isEnabled: true },
    { id: '3', code: 'GB', name: 'United Kingdom', currency: 'GBP', isEnabled: true },
    { id: '4', code: 'JP', name: 'Japan', currency: 'JPY', isEnabled: false },
];

let languages: Language[] = [
    { code: 'en-US', name: 'English (US)', nativeName: 'English', isDefault: true, isEnabled: true, flag: '🇺🇸' },
    { code: 'th-TH', name: 'Thai', nativeName: 'ไทย', isDefault: false, isEnabled: true, flag: '🇹🇭' },
    { code: 'ja-JP', name: 'Japanese', nativeName: '日本語', isDefault: false, isEnabled: false, flag: '🇯🇵' },
];

export const localizationService = {
    getLanguages: async (): Promise<Language[]> => {
        await new Promise(resolve => setTimeout(resolve, 300));
        return [...languages];
    },

    toggleLanguage: async (code: string, isEnabled: boolean): Promise<Language> => {
        await new Promise(resolve => setTimeout(resolve, 200));
        const lang = languages.find(l => l.code === code);
        if (lang) lang.isEnabled = isEnabled;
        return lang!;
    },

    setAsDefault: async (code: string): Promise<Language> => {
        await new Promise(resolve => setTimeout(resolve, 200));
        languages = languages.map(l => ({ ...l, isDefault: l.code === code }));
        return languages.find(l => l.code === code)!;
    },

    getTranslations: async (): Promise<TranslationKey[]> => {
        await new Promise(resolve => setTimeout(resolve, 300));
        return [...translationKeys];
    },

    updateTranslation: async (keyId: string, langCode: string, value: string): Promise<TranslationKey> => {
        await new Promise(resolve => setTimeout(resolve, 200));
        const key = translationKeys.find(k => k.id === keyId);
        if (key) {
            key.translations[langCode] = value;
        }
        return key!;
    },

    getRegions: async (): Promise<Region[]> => {
        await new Promise(resolve => setTimeout(resolve, 300));
        return [...regions];
    },

    toggleRegion: async (id: string, isEnabled: boolean): Promise<Region> => {
        await new Promise(resolve => setTimeout(resolve, 200));
        const region = regions.find(r => r.id === id);
        if (region) region.isEnabled = isEnabled;
        return region!;
    }
};
