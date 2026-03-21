import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, TextInput, Image, ActivityIndicator, FlatList, Pressable } from 'react-native';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import { homeStyles } from '../../styles/homeStyles';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import moment from 'moment';

// Mock Stickers for MVP
const STICKERS = [
  'https://cdn-icons-png.flaticon.com/512/4796/4796558.png', // Heart
  'https://cdn-icons-png.flaticon.com/512/4796/4796561.png', // Thumbs up
  'https://cdn-icons-png.flaticon.com/512/4796/4796564.png', // Smile
  'https://cdn-icons-png.flaticon.com/512/4796/4796562.png', // Star
];

interface CommentDrawerProps {
  visible: boolean;
  onClose: () => void;
  comments: any[];
  loading: boolean;
  newComment: string;
  setNewComment: (comment: string) => void;
  onAddComment: (media?: { type: string; url: string }, parentId?: string) => void;
  onLikeComment?: (commentId: string, isLiked: boolean) => void;
  commentAttachments: any[];
  onAddAttachment: () => void;
  onRemoveAttachment: (id: string) => void;
  onLinkPress?: (url: string) => void;
}

export const CommentDrawer: React.FC<CommentDrawerProps> = ({
  visible,
  onClose,
  comments,
  loading,
  newComment,
  setNewComment,
  onAddComment,
  onLikeComment,
  commentAttachments,
  onAddAttachment,
  onRemoveAttachment,
  onLinkPress
}) => {
  const [selectedMedia, setSelectedMedia] = React.useState<{ type: 'image' | 'video' | 'sticker' | 'file', uri: string, name?: string } | null>(null);
  const [replyingTo, setReplyingTo] = React.useState<{ id: string; authorName: string } | null>(null);
  const [showStickers, setShowStickers] = React.useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = React.useState(false);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedMedia({ type: 'image', uri: result.assets[0].uri });
        setShowStickers(false);
        setShowAttachmentMenu(false);
      }
    } catch (error) {
      console.log('Error picking image:', error);
    }
  };

  const handlePickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedMedia({ type: 'video', uri: result.assets[0].uri });
        setShowStickers(false);
        setShowAttachmentMenu(false);
      }
    } catch (error) {
      console.log('Error picking video:', error);
    }
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({});
      if (!result.canceled) {
        setSelectedMedia({ type: 'file', uri: result.assets[0].uri, name: result.assets[0].name });
        setShowStickers(false);
        setShowAttachmentMenu(false);
      }
    } catch (error) {
      console.log('Error picking file:', error);
    }
  };

  const handleSend = () => {
    const media = selectedMedia ? { type: selectedMedia.type, url: selectedMedia.uri } : undefined;
    const parentId = replyingTo?.id;

    onAddComment(media, parentId);
    setSelectedMedia(null);
    setReplyingTo(null);
    setShowStickers(false);
    setShowAttachmentMenu(false);
  };


  const handleReply = (commentId: string, authorName: string) => {
    setReplyingTo({ id: commentId, authorName });
    // Focus input? Ideally yes, but ref needed. For now just state update.
  };

  const CommentItem = ({ item, depth = 0 }: { item: any, depth?: number }) => {
    const authorName = item.author?.first_name
      ? `${item.author.first_name} ${item.author.last_name || ''}`.trim()
      : 'Unknown';
    const initial = authorName.charAt(0).toUpperCase();
    const isLiked = item.is_liked;

    return (
      <View style={{ marginLeft: depth * 20, marginBottom: 16 }}>
        <View style={{ flexDirection: 'row' }}>
          <View style={homeStyles.commentAvatar}>
            {item.author?.avatar_url ? (
              <Image source={{ uri: item.author.avatar_url }} style={{ width: 32, height: 32, borderRadius: 16 }} />
            ) : (
              <Text style={homeStyles.commentAvatarText}>{initial}</Text>
            )}
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ paddingVertical: 4 }}>
              <Text>
                <Text style={{ fontWeight: '600', fontSize: 13, color: '#374151' }}>{authorName} </Text>
                <Text style={{ fontSize: 14, color: '#1F2937' }}>{item.content}</Text>
              </Text>
            </View>

            {/* Interactions */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 16, paddingLeft: 4 }}>
              <Text style={{ fontSize: 12, color: '#6B7280' }}>{moment(item.created_at).fromNow()}</Text>

              <TouchableOpacity
                onPress={() => onLikeComment && onLikeComment(item.id, isLiked)}
                style={{ flexDirection: 'row', alignItems: 'center' }}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: isLiked ? '#EF4444' : '#6B7280' }}>Like</Text>
                {item.likes_count > 0 && <Text style={{ fontSize: 12, color: '#6B7280', marginLeft: 4 }}>{item.likes_count}</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleReply(item.id, authorName)}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280' }}>Reply</Text>
              </TouchableOpacity>
            </View>

            {/* Media Rendering */}
            {item.media && (
              <View style={{ marginTop: 8 }}>
                {item.media.type === 'image' || item.media.type === 'sticker' ? (
                  <Image
                    source={{ uri: item.media.url }}
                    style={{ width: 150, height: 100, borderRadius: 8, resizeMode: 'cover' }}
                  />
                ) : null}
              </View>
            )}
          </View>
        </View>

        {/* Render Replies (Simple filtering for now, ideally pre-processed) */}
        {comments && comments.filter(c => (c.parent_id || c.parentId) === item.id).map(reply => (
          <CommentItem key={reply.id} item={reply} depth={depth + 1} />
        ))}
      </View>
    );
  };

  const rootComments = comments ? comments.filter(c => !c.parent_id && !c.parentId) : [];

  const renderComment = ({ item, index }: { item: any, index: number }) => (
    <View>
      {index > 0 && (
        <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 8, marginHorizontal: 16 }} />
      )}
      <View style={{ paddingTop: index === 0 ? 12 : 4 }}>
        <CommentItem item={item} />
      </View>
    </View>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)' }} onPress={onClose} />
      <View style={{ flex: 1, justifyContent: 'flex-end' }} pointerEvents="box-none">
        <View style={homeStyles.commentDrawer}>
          {/* Comment Drawer Header */}
          <View style={homeStyles.commentDrawerHeader}>
            <Text style={homeStyles.commentDrawerTitle}>Comments ({(comments || []).length})</Text>
            <TouchableOpacity
              style={homeStyles.commentDrawerCloseButton}
              onPress={onClose}
            >
              <IconMC name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          {loading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#EF4444" />
            </View>
          ) : (
            <FlatList
              data={rootComments}
              renderItem={renderComment}
              keyExtractor={item => item.id}
              style={homeStyles.commentList}
              contentContainerStyle={{ paddingBottom: 20 }}
              ListEmptyComponent={
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: '#9CA3AF' }}>No comments yet. Be the first!</Text>
                </View>
              }
            />
          )}

          {/* Add Comment Section */}
          <View style={homeStyles.addCommentSection}>
            {/* Replying Indicator */}
            {replyingTo && (
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8 }}>
                <Text style={{ fontSize: 12, color: '#6B7280' }}>Replying to <Text style={{ fontWeight: '600' }}>{replyingTo.authorName}</Text></Text>
                <TouchableOpacity onPress={() => setReplyingTo(null)} style={{ marginLeft: 8 }}>
                  <IconMC name="close-circle" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            )}

            {/* Media Preview */}
            {selectedMedia && (
              <View style={{ paddingHorizontal: 16, paddingBottom: 8, flexDirection: 'row' }}>
                <View>
                  <Image source={{ uri: selectedMedia.uri }} style={{ width: 80, height: 80, borderRadius: 8 }} />
                  <TouchableOpacity
                    style={{ position: 'absolute', top: -8, right: -8, backgroundColor: '#EF4444', borderRadius: 12, padding: 2 }}
                    onPress={() => setSelectedMedia(null)}
                  >
                    <IconMC name="close" size={16} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Sticker Picker */}
            {showStickers && (
              <ScrollView horizontal style={{ height: 60, paddingHorizontal: 12, marginBottom: 8 }} showsHorizontalScrollIndicator={false}>
                {STICKERS.map((sticker, idx) => (
                  <TouchableOpacity key={idx} onPress={() => { setSelectedMedia({ type: 'sticker', uri: sticker }); setShowStickers(false); }} style={{ marginHorizontal: 8 }}>
                    <Image source={{ uri: sticker }} style={{ width: 50, height: 50 }} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View style={[homeStyles.addCommentInputContainer, { alignItems: 'flex-end', position: 'relative' }]}>

              {/* Attachment Popup Menu */}
              {showAttachmentMenu && (
                <View style={{
                  position: 'absolute',
                  bottom: 60,
                  left: 0,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  padding: 8,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 5,
                  borderWidth: 1,
                  borderColor: '#EEF2F6',
                  zIndex: 100,
                  minWidth: 150,
                }}>
                  <TouchableOpacity style={{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }} onPress={handlePickImage}>
                    <IconMC name="image" size={20} color="#6B7280" />
                    <Text style={{ fontSize: 14, color: '#374151' }}>Image</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }} onPress={handlePickVideo}>
                    <IconMC name="video" size={20} color="#6B7280" />
                    <Text style={{ fontSize: 14, color: '#374151' }}>Video</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }} onPress={() => { setShowStickers(true); setShowAttachmentMenu(false); }}>
                    <IconMC name="sticker-emoji" size={20} color="#6B7280" />
                    <Text style={{ fontSize: 14, color: '#374151' }}>Sticker</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }} onPress={handlePickFile}>
                    <IconMC name="file-document" size={20} color="#6B7280" />
                    <Text style={{ fontSize: 14, color: '#374151' }}>File</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Pill Input */}
              <View style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#FFFFFF', // White background
                borderRadius: 24,
                paddingRight: 6,
                paddingLeft: 6,
                minHeight: 48,
                // Floating shadow effect
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
                borderWidth: 0, // Remove border
              }}>
                <TouchableOpacity
                  style={{ padding: 10 }}
                  onPress={() => setShowAttachmentMenu(!showAttachmentMenu)}
                >
                  <IconMC name="paperclip" size={22} color="#6B7280" />
                </TouchableOpacity>

                <TextInput
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    maxHeight: 100,
                    fontSize: 15,
                    color: '#374151',
                    marginLeft: 4,
                  }}
                  placeholder="Add a comment..."
                  placeholderTextColor="#9CA3AF"
                  value={newComment}
                  onChangeText={setNewComment}
                  multiline
                />
                <TouchableOpacity
                  style={{
                    width: 32, height: 32, borderRadius: 16,
                    backgroundColor: (newComment.trim() || selectedMedia) ? '#EF4444' : '#E5E7EB',
                    alignItems: 'center', justifyContent: 'center',
                    marginLeft: 8
                  }}
                  onPress={handleSend}
                  disabled={!newComment.trim() && !selectedMedia}
                >
                  <IconMC name="arrow-up" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};
