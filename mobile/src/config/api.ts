// API Configuration for Bondarys Mobile App

import { config } from './environment';
import { DEVELOPMENT_CONFIG } from './development';

// API Base URL configuration
export const API_BASE_URL = __DEV__ 
  ? DEVELOPMENT_CONFIG.API_BASE_URL 
  : config.apiUrl;

// API Timeout configuration
export const API_TIMEOUT = __DEV__ 
  ? DEVELOPMENT_CONFIG.API_TIMEOUT 
  : 30000;

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
  },
  
  // User Management
  USER: {
    PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/profile',
    DELETE_ACCOUNT: '/user/delete',
    CHANGE_PASSWORD: '/user/change-password',
  },
  
  // Family Management
  FAMILY: {
    CREATE: '/family/create',
    JOIN: '/family/join',
    LEAVE: '/family/leave',
    MEMBERS: '/family/members',
    INVITE: '/family/invite',
    REMOVE_MEMBER: '/family/remove-member',
  },
  
  // Localization
  LOCALIZATION: {
    LANGUAGES: '/localization/languages',
    TRANSLATIONS: '/localization/translations',
    SET_LANGUAGE: '/localization/set-language',
  },
  
  // Chat
  CHAT: {
    MESSAGES: '/chat/messages',
    SEND_MESSAGE: '/chat/send',
    UPLOAD_FILE: '/chat/upload',
  },
  
  // Location
  LOCATION: {
    UPDATE: '/location/update',
    SHARE: '/location/share',
    HISTORY: '/location/history',
  },
  
  // Emergency
  EMERGENCY: {
    ALERT: '/emergency/alert',
    CONTACTS: '/emergency/contacts',
    LOCATION: '/emergency/location',
  },
  
  // Calendar
  CALENDAR: {
    EVENTS: '/calendar/events',
    CREATE_EVENT: '/calendar/create',
    UPDATE_EVENT: '/calendar/update',
    DELETE_EVENT: '/calendar/delete',
  },
  
  // Expenses
  EXPENSES: {
    LIST: '/expenses/list',
    CREATE: '/expenses/create',
    UPDATE: '/expenses/update',
    DELETE: '/expenses/delete',
    CATEGORIES: '/expenses/categories',
  },
  
  // Photos
  PHOTOS: {
    UPLOAD: '/photos/upload',
    LIST: '/photos/list',
    DELETE: '/photos/delete',
    SHARE: '/photos/share',
  },
};

// API Headers
export const getApiHeaders = (token?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// CMS Base URL configuration
export const CMS_BASE_URL = process.env.EXPO_PUBLIC_CMS_URL || 'http://localhost:1337';

// API Request configuration
export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  CMS_URL: CMS_BASE_URL,
  TIMEOUT: API_TIMEOUT,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

export default API_CONFIG;
