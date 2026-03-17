import React from 'react';
import { FlatList, Dimensions } from 'react-native';
import {
  Box,
  Image,
  Pressable,
  useColorModeValue,
  Icon,
} from 'native-base';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import { Photo } from '../../types/gallery';
import { colors } from '../../theme/colors';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 3; // 3 columns with padding

interface PhotoGridProps {
  photos: Photo[];
  selectedPhotos: string[];
  onPhotoPress: (photo: Photo) => void;
  onPhotoLongPress: (photo: Photo) => void;
  onPhotoSelect?: (photoId: string) => void;
  numColumns?: number;
  showSelection?: boolean;
}

const PhotoGrid: React.FC<PhotoGridProps> = ({
  photos,
  selectedPhotos,
  onPhotoPress,
  onPhotoLongPress,
  onPhotoSelect,
  numColumns = 3,
  showSelection = true,
}) => {
  const cardBgColor = useColorModeValue(colors.gray[50], colors.gray[700]);

  const renderPhotoItem = ({ item: photo }: { item: Photo }) => (
    <Pressable
      onPress={() => onPhotoPress(photo)}
      onLongPress={() => onPhotoLongPress(photo)}
    >
      <Box
        w={ITEM_WIDTH}
        h={ITEM_WIDTH}
        borderRadius={8}
        overflow="hidden"
        mb={2}
        mr={2}
        bg={cardBgColor}
        borderWidth={1}
        borderColor={colors.gray[200]}
        position="relative"
      >
        <Image
          source={{ uri: photo.thumbnail || photo.uri }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
        
        {/* Selection indicator */}
        {showSelection && selectedPhotos.includes(photo.id) && (
          <Box
            position="absolute"
            top={2}
            right={2}
            w={6}
            h={6}
            bg={colors.primary[500]}
            borderRadius="full"
            justifyContent="center"
            alignItems="center"
          >
            <Icon as={IconMC} name="check" size={4} color={colors.white[500]} />
          </Box>
        )}
        
        {/* Favorite indicator */}
        {photo.isFavorite && (
          <Box
            position="absolute"
            top={2}
            left={2}
            bg={colors.yellow[500]}
            borderRadius="full"
            p={1}
          >
            <Icon as={IconMC} name="star" size={3} color={colors.white[500]} />
          </Box>
        )}
        
        {/* Shared indicator */}
        {photo.isShared && (
          <Box
            position="absolute"
            bottom={2}
            left={2}
            bg={colors.primary[500]}
            borderRadius="full"
            p={1}
          >
            <Icon as={IconMC} name="share" size={3} color={colors.white[500]} />
          </Box>
        )}
      </Box>
    </Pressable>
  );

  return (
    <FlatList
      data={photos}
      renderItem={renderPhotoItem}
      keyExtractor={(item) => item.id}
      numColumns={numColumns}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16 }}
    />
  );
};

export default PhotoGrid; 
