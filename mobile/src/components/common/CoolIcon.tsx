import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

interface CoolIconProps {
  name: string;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

// NOTE: These are lightweight path approximations intended as temporary stand-ins
// for official Coolicons. Replace individual paths with official Coolicons SVGs
// as they become available in the project.
const ICON_PATHS: Record<string, string> = {
  bell: 'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2Zm6-6v-5a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2Z',
  'bell-ring': 'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2Zm6-6v-5a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2ZM5.5 4L4 5.5M18.5 4L20 5.5',
  home: 'M12 3l9 8h-3v9h-12v-9H3l9-8Z',
  chat: 'M4 4h16v12H7l-3 3V4Z',
  'chat-processing': 'M12 3c5.5 0 10 3.58 10 8s-4.5 8-10 8c-1.24 0-2.43-.18-3.53-.5C5.55 21 2 21 2 21c2.33-2.33 2.7-3.9 2.75-4.5C3.05 15.07 2 13.13 2 11c0-4.42 4.5-8 10-8ZM8 11h2M11 11h2M14 11h2',
  menu: 'M3 6h18M3 12h18M3 18h18',
  magnify: 'M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm10 3-6-6',
  phone: 'M6.6 10.8c1.6 3.2 4.4 6 7.6 7.6l2.6-2.6c.3-.3.8-.4 1.2-.2 1 .4 2.1.7 3.2.8.5.1.8.5.8 1v3a1 1 0 0 1-1 1C10.4 22.4 1.6 13.6 1.6 2.8A1 1 0 0 1 2.6 2h3c.5 0 .9.3 1 .8.1 1.1.4 2.2.8 3.2.1.4 0 .9-.2 1.2L6.6 10.8Z',
  heart: 'M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.7A4 4 0 0 1 19 11c0 5.6-7 10-7 10Z',
  'heart-pulse': 'M3 12h4l2-3 3 6 2-3h7M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.7A4 4 0 0 1 19 11',
  walk: 'M13 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm-4 14 2-7-2-2 3-2 2 2 3 1-1 3-2-1-1 6h-4Z',
  battery: 'M3 8h14v8H3V8Zm16 3h2v2h-2v-2Z',
  sleep: 'M7 7h5L7 12h5M12 7h5l-5 5h5',
  thermometer: 'M10 3a2 2 0 0 1 4 0v7.1a4 4 0 1 1-4 0V3Z',
  map: 'M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6Zm6-2v14m6-10v14',
  'emoticon-happy': 'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Zm-4-7a4 4 0 0 0 8 0M9 10h.01M15 10h.01',
  'image-outline': 'M3 5h18v14H3V5Zm3 10 4-5 3 4 2-3 4 4',
  image: 'M3 5h18v14H3V5Zm3 10 4-5 3 4 2-3 4 4',
  calendar: 'M7 3v2m10-2v2M3 8h18M5 6h14v14H5V6Z',
  'note-text': 'M4 3h12l4 4v14H4V3Zm8 0v4h4',
  apps: 'M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z',
  plus: 'M12 5v14M5 12h14',
  refresh: 'M17 1v6h-6M7 23v-6h6M20 12a8 8 0 1 1-2-5',
  analytics: 'M4 20V4m4 16V10m4 10V6m4 14v-8m4 8V8',
  'check-circle': 'M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20Zm-2-7 6-6-1.4-1.4L10 12.2 7.4 9.6 6 11l4 4Z',
  search: 'M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm10 3-6-6',
  close: 'M6 6l12 12M18 6 6 18',
  'close-circle': 'M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20Zm-5-5 10-10M7 7l10 10',
  'map-marker': 'M12 22s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12Zm0-9a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z',
  'image-plus': 'M3 5h14v10H3V5Zm2 8 3-4 2 3 2-2 3 3M19 7h2M20 6v2',
  'arrow-left': 'M20 12H6m6-6-6 6 6 6',
  'camera-plus': 'M4 7h3l2-2h6l2 2h3v10H4V7Zm8 3v6m-3-3h6',
  camera: 'M4 7h3l2-2h6l2 2h3v10H4V7Z',
  'email-plus': 'M4 6h16v12H4V6Zm0 0 8 6 8-6M12 9v6m-3-3h6',
  qrcode: 'M3 3h6v6H3V3Zm12 0h6v6h-6V3ZM3 15h6v6H3v-6Zm12 0h2v2h-2v-2Zm4 0h2v2h-2v-2Zm-4 4h2v2h-2v-2Zm4 2h2v-2h-2v2Z',
  location: 'M12 22s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12Zm0-9a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z',
  call: 'M6.6 10.8c1.6 3.2 4.4 6 7.6 7.6l2.6-2.6c.3-.3.8-.4 1.2-.2 1 .4 2.1.7 3.2.8.5.1.8.5.8 1v3a1 1 0 0 1-1 1C10.4 22.4 1.6 13.6 1.6 2.8A1 1 0 0 1 2.6 2h3c.5 0 .9.3 1 .8.1 1.1.4 2.2.8 3.2.1.4 0 .9-.2 1.2L6.6 10.8Z',
  chatbubble: 'M4 4h16v12H7l-3 3V4Z',
  'account-group': 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9v-1a6 6 0 0 1 12 0v1H5Zm14-8a3 3 0 1 0-6 0 5 5 0 0 1 4 5h4v-1a4 4 0 0 0-2-4Z',
  people: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9v-1a6 6 0 0 1 12 0v1H5Z',
  lock: 'M7 10V8a5 5 0 0 1 10 0v2h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1Zm2 0h6V8a3 3 0 0 0-6 0v2Z',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm10 4a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  'account-multiple': 'M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Zm-13 9v-1a7 7 0 0 1 14 0v1H3Z',
  account: 'M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm-9 9v-1a9 9 0 0 1 18 0v1H3Z',
  wallet: 'M3 7a2 2 0 0 1 2-2h14a1 1 0 0 1 1 1v2H5a2 2 0 0 1-2-2Zm0 4h17v8H5a2 2 0 0 1-2-2v-6Zm12 3a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  'house-03': 'M3 12l9-9 9 9v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8Z',
  settings: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm8-3.5c0-.6-.1-1.1-.2-1.6l2.1-1.6-2-3.4-2.5.8c-.8-.7-1.7-1.2-2.7-1.6l-.4-2.6H9.9l-.4 2.6c-1 .3-1.9.9-2.7 1.6l-2.5-.8-2 3.4 2.1 1.6c-.1.5-.2 1-.2 1.6s.1 1.1.2 1.6l-2.1 1.6 2 3.4 2.5-.8c.8.7 1.7 1.2 2.7 1.6l.4 2.6h4.2l.4-2.6c1-.3 1.9-.9 2.7-1.6l2.5.8 2-3.4-2.1-1.6c.1-.5.2-1 .2-1.6Z',
  'chat-processing-outline': 'M12 3c5.5 0 10 3.58 10 8s-4.5 8-10 8c-1.24 0-2.43-.18-3.53-.5C5.55 21 2 21 2 21c2.33-2.33 2.7-3.9 2.75-4.5C3.05 15.07 2 13.13 2 11c0-4.42 4.5-8 10-8',
  'home-heart': 'M12 3l9 8h-3v9h-4v-5h-4v5H6v-9H3l9-8Zm0 6a2 2 0 0 0-2 2c0 1.5 2 3 2 3s2-1.5 2-3a2 2 0 0 0-2-2Z',
};

export const CoolIcon: React.FC<CoolIconProps> = ({ name, size = 24, color = '#000', style }) => {
  const path = ICON_PATHS[name];
  if (!path) {
    // Fallback placeholder to avoid crashes if an unmapped name is used
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style as any}>
        <Rect x={4} y={4} width={16} height={16} rx={8} stroke={color} strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style as any}>
      <Path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

export default CoolIcon;






