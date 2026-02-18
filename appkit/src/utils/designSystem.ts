/**
 * Design System Utilities
 * Helper functions for applying macOS-inspired design consistently
 */

export const designSystem = {
  // Replace old card classes with new glass panel classes
  card: {
    old: 'bg-white rounded-2xl shadow-sm border border-gray-100',
    new: 'card-macos',
  },
  
  // Replace old button classes
  button: {
    primary: {
      old: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200',
      new: 'btn-macos-primary',
    },
    secondary: {
      old: 'px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold transition-colors duration-200',
      new: 'btn-macos-secondary',
    },
  },
  
  // Replace old input classes
  input: {
    old: 'w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white',
    new: 'input-macos',
  },
  
  // Replace old select classes
  select: {
    old: 'w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white',
    new: 'input-macos',
  },
  
  // Loading spinner
  loading: {
    old: 'animate-spin rounded-full h-12 w-12 border-b-2 border-red-600',
    new: 'relative w-16 h-16',
  },
}





