import React, { createContext, useContext, useState, useRef, useCallback, ReactNode } from 'react';
import { Animated } from 'react-native';

export type MainSection = 'home' | 'gallery' | 'calendar' | 'notes' | 'chat' | 'finance';

interface MainContentContextValue {
  activeSection: MainSection;
  previousSection: MainSection | null;
  setActiveSection: (s: MainSection) => void;
  contentOpacityAnim: Animated.Value;
  contentScaleAnim: Animated.Value;
  showAppsDrawer: boolean;
  setShowAppsDrawer: (show: boolean) => void;
}

const MainContentContext = createContext<MainContentContextValue | undefined>(undefined);

export const MainContentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeSection, setActiveSectionState] = useState<MainSection>('home');
  const [previousSection, setPreviousSection] = useState<MainSection | null>(null);
  const [showAppsDrawer, setShowAppsDrawer] = useState(false);

  // Animation values
  const contentOpacityAnim = useRef(new Animated.Value(1)).current;
  const contentScaleAnim = useRef(new Animated.Value(1)).current;

  const setActiveSection = useCallback((newSection: MainSection) => {
    if (newSection === activeSection) return;

    setPreviousSection(activeSection);

    // Scale + Fade animation - premium zoom effect
    Animated.parallel([
      Animated.timing(contentOpacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(contentScaleAnim, {
        toValue: 0.95, // Scale down slightly when exiting
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Change section
      setActiveSectionState(newSection);

      // Reset scale for incoming animation
      contentScaleAnim.setValue(1.03); // Start slightly larger

      // Animate in new content
      Animated.parallel([
        Animated.timing(contentOpacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(contentScaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [activeSection, contentOpacityAnim, contentScaleAnim]);

  return (
    <MainContentContext.Provider value={{
      activeSection,
      previousSection,
      setActiveSection,
      contentOpacityAnim,
      contentScaleAnim,
      showAppsDrawer,
      setShowAppsDrawer,
    }}>
      {children}
    </MainContentContext.Provider>
  );
};

export const useMainContent = (): MainContentContextValue => {
  const ctx = useContext(MainContentContext);
  if (!ctx) throw new Error('useMainContent must be used within MainContentProvider');
  return ctx;
};
