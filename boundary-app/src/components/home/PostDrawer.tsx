import React from 'react';
import { Modal, View, Text, TouchableOpacity, Image, Pressable } from 'react-native';
import CoolIcon from '../common/CoolIcon';
import { homeStyles } from '../../styles/homeStyles';

interface PostDrawerProps {
  visible: boolean;
  onClose: () => void;
  authorName: string;
  timestamp: string;
  content: string;
  imageUri?: string | null;
  locationLabel?: string | null;
}

export const PostDrawer: React.FC<PostDrawerProps> = ({
  visible,
  onClose,
  authorName,
  timestamp,
  content,
  imageUri,
  locationLabel,
}) => {
  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)' }} onPress={onClose} />
      <View style={{ flex: 1, justifyContent: 'flex-end' }} pointerEvents="box-none">
        <View style={homeStyles.commentDrawer}>
          <View style={homeStyles.commentDrawerHeader}>
            <Text style={homeStyles.commentDrawerTitle}>New Post</Text>
            <TouchableOpacity style={homeStyles.commentDrawerCloseButton} onPress={onClose}>
              <CoolIcon name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
            <View style={homeStyles.socialPostHeader}>
              <View style={homeStyles.socialPostAuthor}>
                <View style={homeStyles.socialPostAvatar}>
                  <Text style={homeStyles.socialPostAvatarText}>{authorName.charAt(0)}</Text>
                </View>
                <View style={homeStyles.socialPostAuthorInfo}>
                  <View style={homeStyles.socialPostAuthorNameRow}>
                    <Text style={homeStyles.socialPostAuthorName}>{authorName}</Text>
                    <CoolIcon name="check-circle" size={16} color="#3B82F6" />
                  </View>
                  <Text style={homeStyles.socialPostTimestamp}>{timestamp}</Text>
                </View>
              </View>
            </View>

            <Text style={homeStyles.socialPostContent}>{content}</Text>

            {!!imageUri && (
              <View style={homeStyles.socialPostMedia}>
                <Image source={{ uri: imageUri }} style={{ width: '100%', height: 220, borderRadius: 12 }} resizeMode="cover" />
              </View>
            )}

            {!!locationLabel && (
              <View style={homeStyles.commentAttachment}>
                <View style={homeStyles.commentAttachmentPreview}>
                <CoolIcon name="map-marker" size={20} color="#3B82F6" />
                  <View style={homeStyles.commentAttachmentInfo}>
                    <Text style={homeStyles.commentAttachmentText} numberOfLines={1}>{locationLabel}</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};


