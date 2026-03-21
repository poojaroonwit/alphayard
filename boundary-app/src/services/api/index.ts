// Re-export the unified apiClient to keep imports stable
export { apiClient as api } from './apiClient';
export * from './auth';
export * from './chat';
export * from './location';
export type { LocationStats } from './location'; // Fixed re-export with type keyword
export * from './safety';
export * from './circle';
export * from './storage';
export * from './fileManagement';
export * from './notes';
export * from './todos';

// New data services APIs
export * from './social';
export * from './circleStatus';
export * from './appointments';
export * from './shopping';
export * from './recentlyUsed';
export * from './widgets';
export { circleTypeApi } from './circleTypes';
export * from './identity';
export { calendarApi } from '../calendar/CalendarService';
export { galleryApi } from '../gallery/GalleryService';
