import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal as RNModal,
  Animated,
  Dimensions,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  type?: 'center' | 'bottom' | 'fullscreen';
  size?: 'small' | 'medium' | 'large';
  showCloseButton?: boolean;
  closeOnBackdropPress?: boolean;
  closeOnBackButton?: boolean;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  contentStyle?: ViewStyle;
  backdropStyle?: ViewStyle;
  testID?: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  type = 'center',
  size = 'medium',
  showCloseButton = true,
  closeOnBackdropPress = true,
  closeOnBackButton = true,
  style,
  titleStyle,
  contentStyle,
  backdropStyle,
  testID,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(type === 'bottom' ? 1 : 0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: type === 'bottom' ? 1 : 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, type]);

  const handleBackdropPress = () => {
    if (closeOnBackdropPress) {
      onClose();
    }
  };

  const getModalStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: colors.white,
      borderRadius: type === 'bottom' ? 20 : 12,
      overflow: 'hidden',
    };

    switch (type) {
      case 'center':
        return {
          ...baseStyle,
          width: size === 'small' ? screenWidth * 0.8 : size === 'large' ? screenWidth * 0.95 : screenWidth * 0.9,
          maxHeight: screenHeight * 0.8,
        };
      case 'bottom':
        return {
          ...baseStyle,
          width: '100%',
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        };
      case 'fullscreen':
        return {
          ...baseStyle,
          width: '100%',
          height: '100%',
          borderRadius: 0,
        };
      default:
        return baseStyle;
    }
  };

  const getModalContainerStyle = (): ViewStyle => {
    switch (type) {
      case 'center':
        return {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        };
      case 'bottom':
        return {
          flex: 1,
          justifyContent: 'flex-end',
        };
      case 'fullscreen':
        return {
          flex: 1,
        };
      default:
        return {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        };
    }
  };

  const getContentStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      padding: size === 'small' ? 16 : size === 'large' ? 24 : 20,
    };

    switch (type) {
      case 'center':
        return baseStyle;
      case 'bottom':
        return {
          ...baseStyle,
          paddingBottom: 40,
        };
      case 'fullscreen':
        return {
          ...baseStyle,
          flex: 1,
        };
      default:
        return baseStyle;
    }
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={closeOnBackButton ? onClose : undefined}
      testID={testID}
    >
      <View style={[styles.container, getModalContainerStyle()]}>
        <Animated.View
          style={[
            styles.backdrop,
            { opacity: fadeAnim },
            backdropStyle,
          ]}
        >
          <TouchableOpacity
            style={styles.backdropTouchable}
            onPress={handleBackdropPress}
            activeOpacity={1}
          />
        </Animated.View>

        <Animated.View
          style={[
            getModalStyle(),
            {
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, type === 'bottom' ? screenHeight : 0],
                  }),
                },
              ],
            },
            style,
          ]}
        >
          {(title || showCloseButton) && (
            <View style={styles.header}>
              {title && (
                <Text style={[styles.title, titleStyle]}>{title}</Text>
              )}
              {showCloseButton && (
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={[getContentStyle(), contentStyle]}>
            {children}
          </View>
        </Animated.View>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropTouchable: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[800],
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: colors.gray[600],
    fontWeight: '600',
  },
}); 
