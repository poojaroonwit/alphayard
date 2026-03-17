import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface BrandLogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  color?: string;
  style?: any;
}

const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'medium',
  showText = true,
  color = '#FFFFFF',
  style,
}) => {
  const { branding } = useTheme();
  
  const getSize = () => {
    switch (size) {
      case 'small':
        return { logo: 40, icon: 24, text: 16 };
      case 'large':
        return { logo: 120, icon: 60, text: 42 };
      default:
        return { logo: 80, icon: 40, text: 24 };
    }
  };

  const sizes = getSize();

  if (branding?.logoUrl) {
    return (
      <View style={[styles.container, style]}>
        <Image 
          source={{ uri: branding.logoUrl }} 
          style={{ 
            width: sizes.logo, 
            height: sizes.logo, 
            borderRadius: sizes.logo * 0.2,
            resizeMode: 'contain' 
          }} 
        />
        {showText && (
          <Text style={[styles.logoText, { fontSize: sizes.text, color }]}>
            {branding.appName || 'Boundary'}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.logo,
          {
            width: sizes.logo,
            height: sizes.logo,
            borderRadius: sizes.logo / 2,
          },
        ]}
      >
        <Text
          style={[
            styles.logoIcon,
            {
              fontSize: sizes.icon,
              color,
            },
          ]}
        >
          🏠
        </Text>
      </View>
      {showText && (
        <Text
          style={[
            styles.logoText,
            {
              fontSize: sizes.text,
              color,
            },
          ]}
        >
          Boundary
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    elevation: 4,
  },
  logoIcon: {
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
  },
  logoText: {
    fontWeight: 'bold',
    marginTop: 8,
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
  },
});

export default BrandLogo; 
