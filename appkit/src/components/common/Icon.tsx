type IconName =
  | 'chart-bar'
  | 'document-text'
  | 'users'
  | 'globe'
  | 'server'
  | 'calendar'
  | 'inbox'
  | 'exclamation-triangle'
  | 'megaphone'
  | 'chart-pie'
  | 'cog'
  | 'photo'
  | 'star'
  | 'pin';

export function Icon({ name, className }: { name: IconName; className?: string }) {
  const attrs = `class=\"${className || 'h-4 w-4'}\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"`;
  const paths: Record<IconName, string> = {
    'chart-bar': '<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M3 3v18h18\" /><path stroke-linecap=\"round\" d=\"M7 15v-6m6 6V9m6 6v-9\" />',
    'document-text': '<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M19.5 14.25v2.25A2.25 2.25 0 0 1 17.25 18.75H6.75A2.25 2.25 0 0 1 4.5 16.5V7.5A2.25 2.25 0 0 1 6.75 5.25h6.75m2.25 0 3 3m-3-3v3H15.75\" />',
    'users': '<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M17 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2\" /><circle cx=\"9\" cy=\"7\" r=\"4\" /><path d=\"M23 20v-2a4 4 0 0 0-3-3.87\" /><path d=\"M16 3.13a4 4 0 0 1 0 7.75\" />',
    'globe': '<circle cx=\"12\" cy=\"12\" r=\"10\" /><path d=\"M2 12h20\" /><path d=\"M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z\" />',
    'server': '<rect x=\"2\" y=\"2\" width=\"20\" height=\"8\" rx=\"2\" /><rect x=\"2\" y=\"14\" width=\"20\" height=\"8\" rx=\"2\" /><path d=\"M6 6h.01\" /><path d=\"M6 18h.01\" />',
    'calendar': '<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M8 3v2m8-2v2M4 9h16M5 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z\" />',
    'inbox': '<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M20 13V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6\" /><path d=\"M3 13h4l2 3h6l2-3h4\" />',
    'exclamation-triangle': '<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M12 9v3m0 3h.01\" /><path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M10.29 3.86l-8.3 14.34A1.5 1.5 0 0 0 3.29 21h17.42a1.5 1.5 0 0 0 1.3-2.8L13.71 3.86a1.5 1.5 0 0 0-2.42 0z\" />',
    'megaphone': '<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M3 11l18-5v12L3 13v8\" />',
    'chart-pie': '<path d=\"M11 2v10l-8.66 5A10 10 0 1 0 11 2z\" /><path d=\"M13 12h9A10 10 0 0 1 13 2z\" />',
    'cog': '<circle cx=\"12\" cy=\"12\" r=\"3\" /><path d=\"M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V22a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H2a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V2a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H22a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z\" />',
    'photo': '<rect x=\"3\" y=\"5\" width=\"18\" height=\"14\" rx=\"2\" /><path d=\"M8 13l3-3 5 5\" /><circle cx=\"8\" cy=\"9\" r=\"1.5\" />',
    'star': '<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M11.48 3.5l2.09 4.23 4.67.68-3.38 3.29.8 4.66-4.18-2.2-4.18 2.2.8-4.66L4.7 8.41l4.67-.68 2.11-4.23z\" />',
    'pin': '<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M9 12l-6 6m0 0l6-6m-6 6h12M15 3l6 6m0 0l-6-6m6 6H9\" />'
  };
  const p = paths[name];
  return (
    <span dangerouslySetInnerHTML={{ __html: `<svg ${attrs}>${p}</svg>` }} />
  );
}

