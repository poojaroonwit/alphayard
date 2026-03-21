export const translations = {
    en: {
        // Navigation
        'nav.personal': 'Personal',
        'nav.circle': 'Circle',
        'nav.chat': 'Chat',
        'nav.social': 'Social',
        'nav.apps': 'Apps',

        // App Headers
        'header.apps': 'Applications',
        'header.search_placeholder': 'Search applications...',

        // App Categories
        'apps.cat.all': 'All Apps',
        'apps.cat.communication': 'Communication',
        'apps.cat.productivity': 'Productivity',
        'apps.cat.safety': 'Safety',
        'apps.cat.finance': 'Finance',
        'apps.cat.utilities': 'Utilities',
        'apps.cat.settings': 'Settings',

        // App Names
        'apps.name.gallery': 'Gallery',
        'apps.name.secondhand': 'Second Hand Shop',
        'apps.name.communication': 'Communication',
        'apps.name.storage': 'Storage',
        'apps.name.notes': 'Note & To Do',
        'apps.name.calendar': 'Calendar',
        'apps.name.location': 'Location',
        'apps.name.health': 'Health',
        'apps.name.budget': 'Budget',
        'apps.name.expenses': 'Expenses',
        'apps.name.savings': 'Savings',
        'apps.name.investments': 'Investments',
        'apps.name.circle': 'Circle',
        'apps.name.profile': 'Profile',
        'apps.name.applications': 'Applications',

        // Personal Tab
        'personal.live_status': 'Live Status',
        'personal.finance': 'Finance',
        'personal.health': 'Health',

        // Language Selection
        'lang.welcome': 'Welcome',
        'lang.select_intro': 'Please select your language',
        'lang.english': 'English',
        'lang.thai': 'Thai',
        // Profile
        'profile.myCircle': 'Circle',
        'profile.members': 'members',
        'profile.leaveCircleTitle': 'Leave Circle',
        'profile.leaveCircleConfirm': 'Are you sure you want to leave this circle?',
        'profile.circleActions': 'Circle Actions',
        'profile.viewCircle': 'View Circle',
        'profile.leaveCircle': 'Leave Circle',
        'profile.circleSettings': 'Circle Settings',
        'profile.circleSettingsSaved': 'Settings saved',
        'profile.circleSettingsError': 'Failed to save settings',

        // Common
        'cancel': 'Cancel',
        'save': 'Save',
        'leave': 'Leave',
        'loading': 'Loading...',
        'success': 'Success',
        'error': 'Error',
    },

    th: {
        // Navigation
        'nav.personal': 'ส่วนตัว',
        'nav.circle': 'วงเวียนคนกันเอง',
        'nav.chat': 'แชท',
        'nav.social': 'โซเชียล',
        'nav.apps': 'แอพ',

        // App Headers
        'header.apps': 'แอปพลิเคชัน',
        'header.search_placeholder': 'ค้นหาแอปพลิเคชัน...',

        // App Categories
        'apps.cat.all': 'แอพทั้งหมด',
        'apps.cat.communication': 'การสื่อสาร',
        'apps.cat.productivity': 'ประสิทธิภาพงาน',
        'apps.cat.safety': 'ความปลอดภัย',
        'apps.cat.finance': 'การเงิน',
        'apps.cat.utilities': 'ยูทิลิตี้',
        'apps.cat.settings': 'การตั้งค่า',

        // App Names
        'apps.name.gallery': 'แกลเลอรี',
        'apps.name.secondhand': 'ร้านมือสอง',
        'apps.name.communication': 'การสื่อสาร',
        'apps.name.storage': 'พื้นที่เก็บข้อมูล',
        'apps.name.notes': 'บันทึกและสิ่งที่ต้องทำ',
        'apps.name.calendar': 'ปฏิทิน',
        'apps.name.location': 'ตำแหน่งที่ตั้ง',
        'apps.name.health': 'สุขภาพ',
        'apps.name.budget': 'งบประมาณ',
        'apps.name.expenses': 'ค่าใช้จ่าย',
        'apps.name.savings': 'เงินออม',
        'apps.name.investments': 'การลงทุน',
        'apps.name.circle': 'วงเวียน',
        'apps.name.profile': 'โปรไฟล์',
        'apps.name.applications': 'แอปพลิเคชัน',

        // Personal Tab
        'personal.live_status': 'สถานะสด',
        'personal.finance': 'การเงิน',
        'personal.health': 'สุขภาพ',

        // Language Selection
        'lang.welcome': 'ยินดีต้อนรับ',
        'lang.select_intro': 'กรุณาเลือกภาษา',
        'lang.english': 'ภาษาอังกฤษ',
        'lang.thai': 'ภาษาไทย',
        // Profile
        'profile.myCircle': 'วงเวียนของฉัน',
        'profile.members': 'สมาชิก',
        'profile.leaveCircleTitle': 'ออกจากวงเวียน',
        'profile.leaveCircleConfirm': 'คุณแน่ใจหรือไม่ว่าต้องการออกจากวงเวียนนี้?',
        'profile.circleActions': 'การจัดการวงเวียน',
        'profile.viewCircle': 'ดูวงเวียน',
        'profile.leaveCircle': 'ออกจากวงเวียน',
        'profile.circleSettings': 'การตั้งค่าวงเวียน',
        'profile.circleSettingsSaved': 'บันทึกการตั้งค่าแล้ว',
        'profile.circleSettingsError': 'ไม่สามารถบันทึกการตั้งค่าได้',

        // Common
        'cancel': 'ยกเลิก',
        'save': 'บันทึก',
        'leave': 'ออก',
        'loading': 'กำลังโหลด...',
        'success': 'สำเร็จ',
        'error': 'ข้อผิดพลาด',
    }

};

export type TranslationKey = keyof typeof translations.en;

