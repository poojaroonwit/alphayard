import React from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useCMSPage, useCMSArticles, useCMSCategories } from '../../hooks/useCMS';
import cmsService from '../../services/cms/cmsService';

/**
 * Example component demonstrating CMS integration
 * This shows how to fetch and display content from Strapi CMS
 */

export const CMSPageExample: React.FC<{ slug: string }> = ({ slug }) => {
  const { page, loading, error } = useCMSPage(slug);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FA7272" />
        <Text style={styles.loadingText}>Loading page...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (!page) {
    return (
      <View style={styles.center}>
        <Text style={styles.noContentText}>Page not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{page.title}</Text>
      <Text style={styles.content}>{page.content}</Text>
      {page.seo?.metaDescription && (
        <Text style={styles.meta}>{page.seo.metaDescription}</Text>
      )}
    </ScrollView>
  );
};

export const CMSArticlesExample: React.FC = () => {
  const { articles, loading, error, meta } = useCMSArticles({ page: 1, pageSize: 10 });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FA7272" />
        <Text style={styles.loadingText}>Loading articles...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {articles.map((article) => (
        <View key={article.id} style={styles.articleCard}>
          {article.cover && (
            <Image
              source={{ uri: cmsService.getMediaUrl(article.cover.url) || '' }}
              style={styles.articleImage}
              resizeMode="cover"
            />
          )}
          <Text style={styles.articleTitle}>{article.title}</Text>
          {article.excerpt && (
            <Text style={styles.articleExcerpt}>{article.excerpt}</Text>
          )}
          {article.category && (
            <Text style={styles.categoryTag}>{article.category.name}</Text>
          )}
        </View>
      ))}
    </ScrollView>
  );
};

export const CMSCategoriesExample: React.FC = () => {
  const { categories, loading, error } = useCMSCategories();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FA7272" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.categoriesContainer}>
      {categories.map((category) => (
        <View key={category.id} style={styles.categoryCard}>
          <Text style={styles.categoryName}>{category.name}</Text>
          {category.description && (
            <Text style={styles.categoryDescription}>{category.description}</Text>
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    padding: 20,
    backgroundColor: '#FFE5E5',
    borderRadius: 8,
    margin: 16,
  },
  errorText: {
    color: '#FF4757',
    fontSize: 14,
  },
  noContentText: {
    fontSize: 16,
    color: '#999',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
    color: '#1D1D1F',
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 16,
  },
  meta: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  articleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  articleImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  articleTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1D1D1F',
  },
  articleExcerpt: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  categoryTag: {
    fontSize: 12,
    color: '#FA7272',
    fontWeight: '600',
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    margin: 8,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 12,
    color: '#666',
  },
});

