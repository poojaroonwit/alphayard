import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
}

interface SocialWidgetProps {
  posts: Post[];
  onPostPress?: (post: Post) => void;
}

export const SocialWidget: React.FC<SocialWidgetProps> = ({
  posts,
  onPostPress,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Community Posts</Text>
      </View>
      
      {posts.length === 0 ? (
        <View style={styles.emptyState}>
          <IconMC name="forum" size={48} color="#CCC" />
          <Text style={styles.emptyText}>No community posts yet</Text>
        </View>
      ) : (
        <View style={styles.postsList}>
          {posts.map((post) => (
            <View key={post.id} style={styles.postItem}>
              <Text style={styles.postTitle}>{post.title}</Text>
              <Text style={styles.postAuthor}>by {post.author}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  postsList: {
    gap: 12,
  },
  postItem: {
    paddingVertical: 8,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  postAuthor: {
    fontSize: 14,
    color: '#666',
  },
});
