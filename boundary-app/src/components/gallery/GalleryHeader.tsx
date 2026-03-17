import React from 'react';
import {
  HStack,
  VStack,
  Text,
  Icon,
  IconButton,
  useColorModeValue,
  Badge,
} from 'native-base';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../../theme/colors';
import { textStyles } from '../../theme/typography';

interface GalleryHeaderProps {
  title: string;
  subtitle?: string;
  photoCount?: number;
  albumCount?: number;
  onBackPress?: () => void;
  onAddPress?: () => void;
  onMenuPress?: () => void;
  showBackButton?: boolean;
  showAddButton?: boolean;
  showMenuButton?: boolean;
  rightAction?: {
    icon: string;
    onPress: () => void;
    color?: string;
  };
}

const GalleryHeader: React.FC<GalleryHeaderProps> = ({
  title,
  subtitle,
  photoCount,
  albumCount,
  onBackPress,
  onAddPress,
  onMenuPress,
  showBackButton = true,
  showAddButton = true,
  showMenuButton = true,
  rightAction,
}) => {
  const bgColor = useColorModeValue(colors.white[500], colors.gray[900]);
  const textColor = useColorModeValue(colors.gray[800], colors.white[500]);

  const getSubtitle = () => {
    if (subtitle) return subtitle;
    if (photoCount !== undefined && albumCount !== undefined) {
      return `${photoCount} photos • ${albumCount} albums`;
    }
    if (photoCount !== undefined) {
      return `${photoCount} photos`;
    }
    if (albumCount !== undefined) {
      return `${albumCount} albums`;
    }
    return '';
  };

  return (
    <HStack
      bg={bgColor}
      px={4}
      py={3}
      alignItems="center"
      space={3}
      shadow={2}
    >
      {showBackButton && onBackPress && (
        <IconButton
          icon={<Icon as={IconMC} name="arrow-left" size={6} />}
          onPress={onBackPress}
          variant="ghost"
        />
      )}
      
      <VStack flex={1}>
        <HStack space={2} alignItems="center">
          <Text style={textStyles.h3} color={textColor} fontWeight="600">
            {title}
          </Text>
          {rightAction && (
            <IconButton
              icon={<Icon as={IconMC} name={rightAction.icon as any} size={5} />}
              onPress={rightAction.onPress}
              variant="ghost"
              colorScheme={rightAction.color ? undefined : 'primary'}
              _icon={{ color: rightAction.color }}
            />
          )}
        </HStack>
        {getSubtitle() && (
          <Text style={textStyles.caption} color={colors.gray[600]}>
            {getSubtitle()}
          </Text>
        )}
      </VStack>
      
      <HStack space={2}>
        {showAddButton && onAddPress && (
          <IconButton
            icon={<Icon as={IconMC} name="plus" size={6} />}
            onPress={onAddPress}
            variant="ghost"
            colorScheme="primary"
          />
        )}
        
        {showMenuButton && onMenuPress && (
          <IconButton
            icon={<Icon as={IconMC} name="dots-vertical" size={6} />}
            onPress={onMenuPress}
            variant="ghost"
          />
        )}
      </HStack>
    </HStack>
  );
};

export default GalleryHeader; 
