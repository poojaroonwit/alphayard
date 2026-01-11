-- Seed translations
INSERT INTO public.translations (key, en, th) VALUES
('nav.you', 'You', 'คุณ'),
('nav.family', 'Family', 'ครอบครัว'),
('nav.chat', 'Chat', 'แชท'),
('nav.social', 'Social', 'โซเชียล'),
('nav.apps', 'Apps', 'แอพ'),
('header.apps', 'Applications', 'แอปพลิเคชัน'),
('header.search_placeholder', 'Search applications...', 'ค้นหาแอปพลิเคชัน...'),
('you.live_status', 'Live Status', 'สถานะสด'),
('you.chatbot_briefing', 'Briefing', 'สรุปข้อมูล'),
('you.finance', 'Finance', 'การเงิน'),
('you.health', 'Health', 'สุขภาพ'),
('lang.welcome', 'Welcome', 'ยินดีต้อนรับ'),
('lang.select_intro', 'Please select your language', 'กรุณาเลือกภาษา'),
('lang.english', 'English', 'ภาษาอังกฤษ'),
('lang.thai', 'Thai', 'ภาษาไทย')
ON CONFLICT (key) DO UPDATE SET
    en = EXCLUDED.en,
    th = EXCLUDED.th;
