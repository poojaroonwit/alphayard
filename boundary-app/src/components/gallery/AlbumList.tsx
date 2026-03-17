import React from 'react';
import { FlatList } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Image,
  Pressable,
  useColorModeValue,
  Icon,
  Badge,
  IconButton,
} from 'native-base';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import { Album } from '../../types/gallery';
import { colors } from '../../theme/colors';
import { textStyles } from '../../theme/typography';

interface AlbumListProps {
  albums: Album[];
  onAlbumPress: (album: Album) => void;
  onAlbumLongPress?: (album: Album) => void;
  showActions?: boolean;
  onEditAlbum?: (album: Album) => void;
  onDeleteAlbum?: (album: Album) => void;
}

const AlbumList: React.FC<AlbumListProps> = ({
  albums,
  onAlbumPress,
  onAlbumLongPress,
  showActions = false,
  onEditAlbum,
  onDeleteAlbum,
}) => {
  const cardBgColor = useColorModeValue(colors.white[500], colors.gray[800]);
  const textColor = useColorModeValue(colors.gray[800], colors.white[500]);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderAlbumItem = ({ item: album }: { item: Album }) => (
    <Pressable
      onPress={() => onAlbumPress(album)}
      onLongPress={() => onAlbumLongPress?.(album)}
    >
      <Box
        bg={cardBgColor}
        p={4}
        borderRadius={12}
        mb={3}
        borderWidth={1}
        borderColor={colors.gray[200]}
      >
        <HStack space={3} alignItems="center">
          <Box
            w={16}
            h={16}
            borderRadius={8}
            overflow="hidden"
            bg={colors.gray[300]}
          >
            {album.coverPhoto ? (
              <Image
                source={{ uri: album.coverPhoto }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            ) : (
              <Box
                flex={1}
                justifyContent="center"
                alignItems="center"
                bg={colors.gray[200]}
              >
                <Icon as={IconMC} name="image" size={6} color={colors.gray[500]} />
              </Box>
            )}
          </Box>
          
          <VStack flex={1}>
            <HStack space={2} alignItems="center">
              <Text style={textStyles.h4} color={textColor} fontWeight="600">
                {album.name}
              </Text>
              {album.isShared && (
                <Badge colorScheme="primary" variant="subtle" size="xs">
                  Shared
                </Badge>
              )}
            </HStack>
            
            {album.description && (
              <Text style={textStyles.caption} color={colors.gray[600]} numberOfLines={2}>
                {album.description}
              </Text>
            )}
            
            <HStack space={2} mt={1}>
              <Text style={textStyles.caption} color={colors.gray[500]}>
                {album.photoCount} photos
              </Text>
              <Text style={textStyles.caption} color={colors.gray[500]}>
                {formatDate(album.updatedAt)}
              </Text>
            </HStack>
          </VStack>
          
          {showActions ? (
            <HStack space={1}>
              {onEditAlbum && (
                <IconButton
                  icon={<Icon as={IconMC} name="pencil" size={4} />}
                  variant="ghost"
                  size="sm"
                  colorScheme="blue"
                  onPress={() => onEditAlbum(album)}
                />
              )}
              {onDeleteAlbum && (
                <IconButton
                  icon={<Icon as={IconMC} name="delete" size={4} />}
                  variant="ghost"
                  size="sm"
                  colorScheme="red"
                  onPress={() => onDeleteAlbum(album)}
                />
              )}
            </HStack>
          ) : (
            <IconButton
              icon={<Icon as={IconMC} name="chevron-right" size={5} />}
              variant="ghost"
              size="sm"
              colorScheme="gray"
            />
          )}
        </HStack>
      </Box>
    </Pressable>
  );

  return (
    <FlatList
      data={albums}
      renderItem={renderAlbumItem}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16 }}
    />
  );
};

export default AlbumList; 
