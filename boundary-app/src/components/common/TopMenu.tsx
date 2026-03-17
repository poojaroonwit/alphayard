import React from 'react';
import {
  HStack,
  IconButton,
  Icon,
  Text,
  useColorModeValue,
  Pressable,
} from 'native-base';
import { useNavigation } from '@react-navigation/native';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';

interface TopMenuProps {
  title?: string;
  showBackButton?: boolean;
  showMenuButton?: boolean;
  onMenuPress?: () => void;
  rightComponent?: React.ReactNode;
}

export const TopMenu: React.FC<TopMenuProps> = ({
  title = 'Boundary',
  showBackButton = false,
  showMenuButton = true,
  onMenuPress,
  rightComponent,
}) => {
  const navigation = useNavigation();
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const iconColor = useColorModeValue('gray.600', 'gray.300');

  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleMenuPress = () => {
    if (onMenuPress) {
      onMenuPress();
    } else {
      // Default menu action - could open a drawer or show options
      console.log('Menu pressed');
    }
  };

  return (
    <HStack
      bg={bgColor}
      px={4}
      py={3}
      alignItems="center"
      justifyContent="space-between"
      borderBottomWidth={1}
      borderBottomColor={useColorModeValue('gray.200', 'gray.700')}
    >
      <HStack alignItems="center" space={3}>
        {showBackButton && (
          <IconButton
            icon={<Icon as={IconMC} name="arrow-left" size="sm" color={iconColor} />}
            onPress={handleBackPress}
            variant="ghost"
            size="sm"
          />
        )}
        {showMenuButton && !showBackButton && (
          <IconButton
            icon={<Icon as={IconMC} name="menu" size="sm" color={iconColor} />}
            onPress={handleMenuPress}
            variant="ghost"
            size="sm"
          />
        )}
        <Text fontSize="lg" fontWeight="semibold" color={textColor}>
          {title}
        </Text>
      </HStack>

      {rightComponent && (
        <HStack alignItems="center" space={2}>
          {rightComponent}
        </HStack>
      )}
    </HStack>
  );
};

export default TopMenu; 
