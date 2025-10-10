export const colors = {
  // Monochrome base
  black: '#111111',
  white: '#FFFFFF',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray400: '#9CA3AF',
  gray600: '#4B5563',
  gray800: '#1F2937',

  // Accent (a bit of color)
  primary: '#4F46E5', // indigo

  // Semantic derived from mono + accent
  surface: '#FFFFFF',
  background: '#FFFFFF',
  text: '#111111',
  textSecondary: '#4B5563',
  success: '#059669',
  warning: '#F59E0B',
  danger: '#EF4444',

  // Gradients
  indigo: ['#111111', '#1F2937'], 
  teal: ['#4F46E5', '#4F46E5'],   
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};

export const shadow = {
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  strong: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
};
