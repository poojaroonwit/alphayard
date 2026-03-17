// Web polyfills - lazy loaded to avoid early React Native access

// BackHandler polyfill for web
(function () {
  // ... rest of logic

  if (typeof window !== 'undefined') { // Force web check
    const BackHandler = {
      addEventListener: () => ({ remove: () => { } }),
      removeEventListener: () => { },
      exitApp: () => { },
      goBack: () => { },
    };

    (global as any).BackHandler = BackHandler;

    try {
      // Even use explicit require here if needed, but let's stick to safe pattern
    } catch { }
  }
})();

export const webPolyfills = {
  get BackHandler() {
    return {
      addEventListener: () => ({ remove: () => { } }),
      removeEventListener: () => { },
      exitApp: () => { },
      goBack: () => { },
    };
  },
};
