export const translations = {
    en: {
        // Navigation
        'nav.you': 'You',
        'nav.family': 'Family',
        'nav.chat': 'Chat',
        'nav.social': 'Social',
        'nav.apps': 'Apps',

        // App Headers
        'header.apps': 'Applications',
        'header.search_placeholder': 'Search applications...',

        // You Tab
        'you.live_status': 'Live Status',
        'you.chatbot_briefing': 'Briefing',
        'you.finance': 'Finance',
        'you.health': 'Health',

        // Language Selection
        'lang.welcome': 'Welcome',
        'lang.select_intro': 'Please select your language',
        'lang.english': 'English',
        'lang.thai': 'Thai',
    },
    th: {
        // Navigation
        'nav.you': 'คุณ',
        'nav.family': 'ครอบครัว',
        'nav.chat': 'แชท',
        'nav.social': 'โซเชียล',
        'nav.apps': 'แอพ',

        // App Headers
        'header.apps': 'แอปพลิเคชัน',
        'header.search_placeholder': 'ค้นหาแอปพลิเคชัน...',

        // You Tab
        'you.live_status': 'สถานะสด',
        'you.chatbot_briefing': 'สรุปข้อมูล',
        'you.finance': 'การเงิน',
        'you.health': 'สุขภาพ',

        // Language Selection
        'lang.welcome': 'ยินดีต้อนรับ',
        'lang.select_intro': 'กรุณาเลือกภาษา',
        'lang.english': 'ภาษาอังกฤษ',
        'lang.thai': 'ภาษาไทย',
    }
};

export type TranslationKey = keyof typeof translations.en;
