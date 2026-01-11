import React, { createContext, useContext, useState, useRef, useCallback, ReactNode } from 'react';
import { Animated } from 'react-native';

export type MainSection = 'home' | 'gallery' | 'calendar' | 'notes' | 'chat' | 'finance';
export type HomeTab = 'you' | 'family' | 'social';

interface MainContentContextValue {
  activeSection: MainSection;
  previousSection: MainSection | null;
  setActiveSection: (s: MainSection) => void;
  contentOpacityAnim: Animated.Value;
  contentScaleAnim: Animated.Value;
  showAppsDrawer: boolean;
  setShowAppsDrawer: (show: boolean) => void;
  // Tab animation
  activeTab: HomeTab;
  animateTabChange: (newTab: HomeTab) => void;
  tabContentOpacityAnim: Animated.Value;
  tabContentTranslateXAnim: Animated.Value;
}

const MainContentContext = createContext<MainContentContextValue | undefined>(undefined);

export const MainContentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeSection, setActiveSectionState] = useState<MainSection>('home');
  const [previousSection, setPreviousSection] = useState<MainSection | null>(null);
  const [showAppsDrawer, setShowAppsDrawer] = useState(false);
  const [activeTab, setActiveTabState] = useState<HomeTab>('you');

  // Animation values for section changes
  const contentOpacityAnim = useRef(new Animated.Value(1)).current;
  const contentScaleAnim = useRef(new Animated.Value(1)).current;

  // Animation values for tab changes
  const tabContentOpacityAnim = useRef(new Animated.Value(1)).current;
  const tabContentTranslateXAnim = useRef(new Animated.Value(0)).current;

  const tabOrder: HomeTab[] = ['you', 'family', 'social'];

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

  const animateTabChange = useCallback((newTab: HomeTab) => {
    if (newTab === activeTab) return;

    const currentIndex = tabOrder.indexOf(activeTab);
    const newIndex = tabOrder.indexOf(newTab);
    const direction = newIndex > currentIndex ? 1 : -1; // 1 = slide left, -1 = slide right

    // Fade out and slide current content
    Animated.parallel([
      Animated.timing(tabContentOpacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(tabContentTranslateXAnim, {
        toValue: -30 * direction, // Slide out in opposite direction
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Change tab
      setActiveTabState(newTab);

      // Reset position for incoming animation (from opposite side)
      tabContentTranslateXAnim.setValue(30 * direction);

      // Fade in and slide new content
      Animated.parallel([
        Animated.timing(tabContentOpacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(tabContentTranslateXAnim, {
          toValue: 0,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [activeTab, tabContentOpacityAnim, tabContentTranslateXAnim]);

  return (
    <MainContentContext.Provider value={{
      activeSection,
      previousSection,
      setActiveSection,
      contentOpacityAnim,
      contentScaleAnim,
      showAppsDrawer,
      setShowAppsDrawer,
      activeTab,
      animateTabChange,
      tabContentOpacityAnim,
      tabContentTranslateXAnim,
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
