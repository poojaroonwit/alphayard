import { useState, useEffect } from 'react';
import cmsService, { CMSPage, CMSArticle, CMSCategory, CMSMenu } from '../services/cms/cmsService';

/**
 * Hook for fetching CMS pages
 */
export const useCMSPage = (slug: string, locale?: string) => {
  const [page, setPage] = useState<CMSPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await cmsService.getPageBySlug(slug, locale);
        setPage(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load page');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPage();
    }
  }, [slug, locale]);

  return { page, loading, error };
};

/**
 * Hook for fetching CMS articles
 */
export const useCMSArticles = (params?: {
  page?: number;
  pageSize?: number;
  category?: string;
  locale?: string;
}) => {
  const [articles, setArticles] = useState<CMSArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<any>(null);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await cmsService.getArticles(params);
        setArticles(result.data);
        setMeta(result.meta);
      } catch (err: any) {
        setError(err.message || 'Failed to load articles');
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [params?.page, params?.category, params?.locale]);

  return { articles, loading, error, meta };
};

/**
 * Hook for fetching a single CMS article
 */
export const useCMSArticle = (slug: string, locale?: string) => {
  const [article, setArticle] = useState<CMSArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await cmsService.getArticleBySlug(slug, locale);
        setArticle(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load article');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchArticle();
    }
  }, [slug, locale]);

  return { article, loading, error };
};

/**
 * Hook for fetching CMS categories
 */
export const useCMSCategories = (locale?: string) => {
  const [categories, setCategories] = useState<CMSCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await cmsService.getCategories(locale);
        setCategories(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [locale]);

  return { categories, loading, error };
};

/**
 * Hook for fetching CMS menu
 */
export const useCMSMenu = (slug: string, locale?: string) => {
  const [menu, setMenu] = useState<CMSMenu | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await cmsService.getMenu(slug, locale);
        setMenu(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load menu');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchMenu();
    }
  }, [slug, locale]);

  return { menu, loading, error };
};

