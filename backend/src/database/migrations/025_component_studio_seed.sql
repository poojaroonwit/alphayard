-- Component Studio Seed Data
-- This migration seeds default style variants for common component categories.

-- Helper function to generate solid color JSONB
-- Usage: select solid_color('#ffffff');
CREATE OR REPLACE FUNCTION solid_color(hex TEXT) RETURNS JSONB AS $$
BEGIN
    RETURN jsonb_build_object('mode', 'solid', 'solid', hex);
END;
$$ LANGUAGE plpgsql;

-- 1. BUTTONS (Category: buttons)
INSERT INTO component_styles (category_id, name, definition_id, styles, mobile_config, is_system) VALUES
('buttons', 'Primary Button', 'primary', 
 jsonb_build_object(
    'backgroundColor', solid_color('#FFB6C1'), 
    'textColor', solid_color('#FFFFFF'), 
    'borderRadius', 12, 
    'borderColor', solid_color('transparent'), 
    'shadowLevel', 'sm', 
    'clickAnimation', 'scale'
 ),
 jsonb_build_object(
    'componentName', 'ThemedButton', 
    'filePath', 'components/common/ThemedButton.tsx', 
    'usageExample', '<ThemedButton componentId="primary" label="Click Me" onPress={handlePress} />'
 ),
 true),
('buttons', 'Secondary Button', 'secondary', 
 jsonb_build_object(
    'backgroundColor', solid_color('#F3F4F6'), 
    'textColor', solid_color('#4B5563'), 
    'borderRadius', 12, 
    'borderColor', solid_color('transparent'), 
    'shadowLevel', 'none', 
    'clickAnimation', 'scale'
 ),
 jsonb_build_object(
    'componentName', 'ThemedButton', 
    'filePath', 'components/common/ThemedButton.tsx', 
    'usageExample', '<ThemedButton componentId="secondary" label="Cancel" onPress={handleCancel} />'
 ),
 true),
('buttons', 'Destructive Button', 'destructive', 
 jsonb_build_object(
    'backgroundColor', solid_color('#EF4444'), 
    'textColor', solid_color('#FFFFFF'), 
    'borderRadius', 12, 
    'borderColor', solid_color('transparent'), 
    'shadowLevel', 'none', 
    'clickAnimation', 'scale'
 ),
 jsonb_build_object(
    'componentName', 'ThemedButton', 
    'filePath', 'components/common/ThemedButton.tsx', 
    'usageExample', '<ThemedButton componentId="destructive" label="Delete" onPress={handleDelete} />'
 ),
 true);

-- 2. CARDS (Category: cards)
INSERT INTO component_styles (category_id, name, definition_id, styles, mobile_config, is_system) VALUES
('cards', 'Standard Card', 'standard', 
 jsonb_build_object(
    'backgroundColor', solid_color('#FFFFFF'), 
    'borderRadius', 16, 
    'borderColor', solid_color('#E5E7EB'), 
    'shadowLevel', 'md'
 ),
 jsonb_build_object(
    'componentName', 'Card', 
    'filePath', 'components/ui/Card.tsx', 
    'usageExample', '<Card><Text>Content goes here</Text></Card>'
 ),
 true),
('cards', 'Glass Card', 'glass', 
 jsonb_build_object(
    'backgroundColor', solid_color('rgba(255,255,255,0.8)'), 
    'borderRadius', 24, 
    'borderColor', solid_color('rgba(255,255,255,0.2)'), 
    'shadowLevel', 'md'
 ),
 jsonb_build_object(
    'componentName', 'GlassCard', 
    'filePath', 'components/ui/GlassCard.tsx', 
    'usageExample', '<GlassCard intensity={80}><Text>Frosted Glass Effect</Text></GlassCard>'
 ),
 true);

-- 3. INPUTS (Category: inputs)
INSERT INTO component_styles (category_id, name, definition_id, styles, mobile_config, is_system) VALUES
('inputs', 'Text Input', 'text', 
 jsonb_build_object(
    'backgroundColor', solid_color('#F9FAFB'), 
    'borderRadius', 12, 
    'borderColor', solid_color('#E5E7EB'), 
    'textColor', solid_color('#111827'), 
    'focusBorderColor', solid_color('#3B82F6'), 
    'validBorderColor', solid_color('#10B981'), 
    'invalidBorderColor', solid_color('#EF4444')
 ),
 jsonb_build_object(
    'componentName', 'Input', 
    'filePath', 'components/ui/Input.tsx', 
    'usageExample', '<Input placeholder="Enter name" value={name} onChangeText={setName} />'
 ),
 true);

-- 4. MOBILE NAV (Category: mobile-nav)
INSERT INTO component_styles (category_id, name, definition_id, styles, mobile_config, is_system) VALUES
('mobile-nav', 'Mobile Tabbar', 'tab-navigation', 
 jsonb_build_object(
    'backgroundColor', solid_color('rgba(255,255,255,0.95)'), 
    'textColor', solid_color('#64748B')
 ),
 jsonb_build_object(
    'componentName', 'Tabbar', 
    'filePath', 'components/ui/Tabbar.tsx', 
    'usageExample', '<Tabbar tabs={tabs} activeId={activeTab} onSelect={handleTabSelect} />'
 ),
 true);

-- Clean up helper
DROP FUNCTION solid_color(TEXT);
