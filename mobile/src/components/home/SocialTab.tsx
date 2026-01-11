import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView, RefreshControl, Modal, Pressable, StyleSheet, Share, Image } from 'react-native';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import { homeStyles } from '../../styles/homeStyles';
import { socialService } from '../../services/dataServices';
import { SocialPost } from '../../types/home';
import { useDataServiceWithRefresh } from '../../hooks/useDataService';
import moment from 'moment';
import { SortOrder, GeoScope, DistanceUnit, CustomCoordinates } from '../social/PostFilterHeader';
import { CommentDrawer } from './CommentDrawer';

// Mock current user ID - in production, get from auth context
const CURRENT_USER_ID = 'f739edde-45f8-4aa9-82c8-c1876f434683';

interface SocialTabProps {
  onCommentPress: (postId: string) => void;
  familyId?: string;
  refreshKey?: number;
  // Filter Props
  geoScope?: GeoScope;
  distanceKm?: number | null;
  selectedCountry?: string;
  customCoordinates?: CustomCoordinates;
  sortOrder?: SortOrder;
}

export const SocialTab: React.FC<SocialTabProps> = ({
  familyId,
  refreshKey,
  geoScope = 'nearby',
  distanceKm = 5,
  selectedCountry,
  customCoordinates,
  sortOrder = 'recent'
}) => {
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [selectedPost, setSelectedPost] = React.useState<SocialPost | null>(null);

  // Filter state REMOVED (now via props)

  // Comment State

  // Comment State
  const [commentDrawerVisible, setCommentDrawerVisible] = React.useState(false);
  const [comments, setComments] = React.useState<any[]>([]);
  const [loadingComments, setLoadingComments] = React.useState(false);
  const [currentPostId, setCurrentPostId] = React.useState<string | null>(null);
  const [newComment, setNewComment] = React.useState('');

  const fetchPosts = React.useCallback(async () => {
    // If no family selected (and we require it contextually), we might return empty.
    // However, backend supports global feed. 
    // To prevent "stuck" loading if backend hangs on empty filter, we can enforce a timeout here.

    // Create a timeout promise
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out')), 10000)
    );

    const apiCall = socialService.getPosts({
      familyId,
      limit: 20
    });

    return Promise.race([apiCall, timeout]);
  }, [familyId, geoScope, distanceKm, selectedCountry, customCoordinates, sortOrder]);

  const {
    data: posts = [],
    error,
    loading,
    refreshing,
    onRefresh,
    clearError,
    setData: setPosts
  } = useDataServiceWithRefresh(
    fetchPosts,
    {
      dependencies: [familyId, refreshKey, geoScope, distanceKm, selectedCountry, customCoordinates, sortOrder]
    }
  );

  // Check if current user is the post owner
  const isPostOwner = (post: SocialPost) => {
    return (post as any).author_id === CURRENT_USER_ID || post.author?.id === CURRENT_USER_ID;
  };

  // Handle menu button press
  const handleMenuPress = (post: SocialPost) => {
    setSelectedPost(post);
    setMenuVisible(true);
  };

  // Handle delete post
  const handleDeletePost = async () => {
    if (!selectedPost) return;
    setMenuVisible(false);

    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await socialService.deletePost(selectedPost.id);
              onRefresh();
              Alert.alert('Success', 'Post deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete post');
            }
          }
        }
      ]
    );
  };

  // Handle hide post
  const handleHidePost = async () => {
    if (!selectedPost) return;
    setMenuVisible(false);

    try {
      await socialService.updatePost(selectedPost.id, { is_hidden: true } as any);
      onRefresh();
      Alert.alert('Success', 'Post hidden successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to hide post');
    }
  };

  // Handle report post (for non-owners)
  const handleReportPost = () => {
    setMenuVisible(false);
    Alert.alert('Report', 'Report feature coming soon');
  };

  // Handle like post
  // Handle like post with optimistic update
  const handleLikePress = async (post: SocialPost) => {
    // Optimistic update
    const previousPosts = [...(posts || [])];
    const isLiked = post.isLiked;
    const newLiked = !isLiked;
    const newCount = (post.likes || 0) + (newLiked ? 1 : -1);

    const updatedPosts = (posts || []).map((p: SocialPost) =>
      p.id === post.id
        ? { ...p, isLiked: newLiked, likes: Math.max(0, newCount) }
        : p
    );
    setPosts(updatedPosts);

    try {
      if (isLiked) {
        await socialService.unlikePost(post.id);
      } else {
        await socialService.likePost(post.id);
      }
      // No need to refresh whole list, state is already correct
    } catch (error) {
      // Revert on error
      setPosts(previousPosts);
      Alert.alert('Error', 'Failed to update like status');
    }
  };

  // Handle share post
  const handleSharePress = async (post: SocialPost) => {
    try {
      const result = await Share.share({
        message: `${post.author.name} shared: ${post.content}`,
        title: `Post by ${post.author.name}`,
      });

      if (result.action === Share.sharedAction) {
        // Shared successfully
      }
    } catch (error: any) {
      Alert.alert(error.message);
    }
  };

  const handleCommentPress = async (postId: string) => {
    setCurrentPostId(postId);
    setCommentDrawerVisible(true);
    setLoadingComments(true);
    setComments([]); // Clear previous
    try {
      const result = await socialService.getPostComments(postId);
      setComments(result);
    } catch (error) {
      console.error("Failed to load comments", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async (media?: { type: string; url: string }) => {
    if (!currentPostId || (!newComment.trim() && !media)) return;
    try {
      const result = await socialService.addComment(currentPostId, newComment, media);
      if (result) {
        setNewComment('');
        // Refresh comments
        const updatedComments = await socialService.getPostComments(currentPostId);
        setComments(updatedComments);
        // Optional: Update post comment count locally or refresh posts
        onRefresh();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add comment');
    }
  };

  // Show error alert if there's an error
  React.useEffect(() => {
    if (error) {
      Alert.alert(
        'Error Loading Posts',
        error,
        [
          { text: 'Retry', onPress: onRefresh },
          { text: 'Cancel', onPress: clearError }
        ]
      );
    }
  }, [error, onRefresh, clearError]);

  // Ensure posts is an array
  const safePosts = Array.isArray(posts) ? posts : [];

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, backgroundColor: 'transparent' }}>
        <View style={homeStyles.section}>

          <View style={{ padding: 20, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#FF5A5A" />
            <Text style={{ marginTop: 10, color: '#666' }}>Loading posts...</Text>
          </View>
        </View>
      </View>
    );
  }

  // Handle like comment with optimistic update
  const handleLikeComment = async (commentId: string, isLiked: boolean) => {
    // Optimistic update
    const previousComments = [...comments];
    const newLiked = !isLiked;

    const updatedComments = comments.map(c => {
      if (c.id === commentId) {
        return {
          ...c,
          is_liked: newLiked,
          likes_count: (c.likes_count || 0) + (newLiked ? 1 : -1)
        };
      }
      return c;
    });
    setComments(updatedComments);

    try {
      if (isLiked) {
        await socialService.unlikeComment(commentId);
      } else {
        await socialService.likeComment(commentId);
      }
    } catch (error) {
      // Revert on error
      setComments(previousComments);
      Alert.alert('Error', 'Failed to update like status');
    }
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={homeStyles.section}>


        <View style={{ marginTop: 12 }}>
          <View style={{ marginTop: 12 }}>
            {/* Filter Header moved to SocialScreen/WelcomeSection */}
          </View>
        </View>
        {safePosts.length === 0 ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <IconMC name="chat-outline" size={48} color="#9CA3AF" />
            <Text style={{ marginTop: 10, color: '#666', textAlign: 'center' }}>
              No posts yet. Start a conversation in hourse chat!
            </Text>
          </View>
        ) : (
          safePosts.map((post, index) => (
            <View key={post.id} style={homeStyles.socialPostListItem}>
              {/* Post Header */}
              <View style={homeStyles.socialPostHeader}>
                <View style={homeStyles.socialPostAuthor}>
                  <View style={homeStyles.socialPostAvatar}>
                    <Text style={homeStyles.socialPostAvatarText}>
                      {post.author.name.charAt(0)}
                    </Text>
                  </View>
                  <View style={homeStyles.socialPostAuthorInfo}>
                    <View style={homeStyles.socialPostAuthorNameRow}>
                      <Text style={homeStyles.socialPostAuthorName}>{post.author.name}</Text>
                      {post.author.isVerified && (
                        <IconMC name="check-circle" size={16} color="#3B82F6" />
                      )}
                    </View>
                    <Text style={homeStyles.socialPostTimestamp}>
                      {moment(post.created_at || post.timestamp).fromNow()} • {moment(post.created_at || post.timestamp).format('LLL')}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={homeStyles.socialPostMoreButton}
                  onPress={() => handleMenuPress(post)}
                >
                  <IconMC name="dots-vertical" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Post Content */}
              <Text style={homeStyles.socialPostContent}>{post.content}</Text>

              {/* Post Media */}
              {post.media && (
                <View style={homeStyles.socialPostMedia}>
                  {post.media.type === 'image' ? (
                    <Image
                      source={{ uri: post.media.url }}
                      style={{ width: '100%', height: 200, borderRadius: 8 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={homeStyles.socialPostMediaPlaceholder}>
                      <IconMC name="play-circle" size={40} color="#9CA3AF" />
                      <Text style={homeStyles.socialPostMediaText}>Video</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Post Actions */}
              <View style={homeStyles.socialPostActions}>
                <TouchableOpacity
                  style={homeStyles.socialPostAction}
                  onPress={() => handleLikePress(post)}
                >
                  <IconMC
                    name={post.isLiked ? "heart" : "heart-outline"}
                    size={20}
                    color={post.isLiked ? "#EF4444" : "#6B7280"}
                  />
                  <Text style={homeStyles.socialPostActionText}>{post.likes}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={homeStyles.socialPostAction}
                  onPress={() => handleCommentPress(post.id)}
                >
                  <IconMC name="comment-outline" size={20} color="#6B7280" />
                  <Text style={homeStyles.socialPostActionText}>{post.comments}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={homeStyles.socialPostAction}
                  onPress={() => handleSharePress(post)}
                >
                  <IconMC name="share-outline" size={20} color="#6B7280" />
                  <Text style={homeStyles.socialPostActionText}>{post.shares}</Text>
                </TouchableOpacity>
              </View>

              {/* Divider (except for last item) */}
              {index < safePosts.length - 1 && (
                <View style={homeStyles.socialPostDivider} />
              )}
            </View>
          ))
        )}
      </View>

      {/* Post Actions Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          style={actionMenuStyles.overlay}
          onPress={() => setMenuVisible(false)}
        >
          <View style={actionMenuStyles.menu}>
            <Text style={actionMenuStyles.title}>Post Options</Text>

            {selectedPost && isPostOwner(selectedPost) ? (
              // Owner options
              <>
                <TouchableOpacity
                  style={actionMenuStyles.menuItem}
                  onPress={handleHidePost}
                >
                  <IconMC name="eye-off-outline" size={24} color="#6B7280" />
                  <Text style={actionMenuStyles.menuItemText}>Hide Post</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[actionMenuStyles.menuItem, actionMenuStyles.destructive]}
                  onPress={handleDeletePost}
                >
                  <IconMC name="delete-outline" size={24} color="#EF4444" />
                  <Text style={[actionMenuStyles.menuItemText, { color: '#EF4444' }]}>Delete Post</Text>
                </TouchableOpacity>
              </>
            ) : (
              // Non-owner options
              <TouchableOpacity
                style={actionMenuStyles.menuItem}
                onPress={handleReportPost}
              >
                <IconMC name="flag-outline" size={24} color="#6B7280" />
                <Text style={actionMenuStyles.menuItemText}>Report Post</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[actionMenuStyles.menuItem, actionMenuStyles.cancel]}
              onPress={() => setMenuVisible(false)}
            >
              <Text style={actionMenuStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>


      <CommentDrawer
        visible={commentDrawerVisible}
        onClose={() => setCommentDrawerVisible(false)}
        comments={comments}
        loading={loadingComments}
        newComment={newComment}
        setNewComment={setNewComment}
        onAddComment={handleAddComment}
        onLikeComment={handleLikeComment}
        commentAttachments={[]}
        onAddAttachment={() => { }}
        onRemoveAttachment={() => { }}
      />
    </ScrollView >
  );
};

// Action menu styles
const actionMenuStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    width: '80%',
    maxWidth: 300,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  menuItemText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  destructive: {
    borderBottomWidth: 0,
  },
  cancel: {
    justifyContent: 'center',
    marginTop: 8,
    borderBottomWidth: 0,
  },
  cancelText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});
