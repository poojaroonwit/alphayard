import { useState } from 'react';

interface PopupState {
  visible: boolean;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export const usePopup = () => {
  const [popup, setPopup] = useState<PopupState>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showPopup = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setPopup({
      visible: true,
      title,
      message,
      type,
    });
  };

  const hidePopup = () => {
    setPopup(prev => ({
      ...prev,
      visible: false,
    }));
  };

  const showSuccess = (title: string, message: string) => {
    showPopup(title, message, 'success');
  };

  const showError = (title: string, message: string) => {
    showPopup(title, message, 'error');
  };

  const showWarning = (title: string, message: string) => {
    showPopup(title, message, 'warning');
  };

  const showInfo = (title: string, message: string) => {
    showPopup(title, message, 'info');
  };

  return {
    popup,
    showPopup,
    hidePopup,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}; 
