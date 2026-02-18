
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { pageService, Page } from '@/services/pageService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '@/components/ui/Table';
import { PlusIcon, MagnifyingGlassIcon, DocumentIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline'; 

import { format } from 'date-fns';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function PagesPage() {
  const router = useRouter();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');

  useEffect(() => {
    fetchPages();
  }, [search]);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const data = await pageService.getAll({ search });
      // Helper to extract array if wrapped
      const list = Array.isArray(data) ? data : (data.pages || []); 
      setPages(list);
    } catch (error) {
      console.error('Failed to fetch pages', error);
      // setPages([]); // Keep empty
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePage = async () => {
    if (!newPageTitle.trim()) return;
    try {
      const slug = newPageSlug || newPageTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const page = await pageService.create({ title: newPageTitle, slug });
      router.push(`/pages/${page.id}`);
    } catch (error) {
      console.error('Failed to create page', error);
      alert('Failed to create page');
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this page?')) {
      await pageService.delete(id);
      fetchPages();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Pages</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage and organize your mobile app screens.</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <PlusIcon className="w-4 h-4" />
          Create Page
        </Button>
      </div>

      <div className="flex items-center space-x-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Search pages..." 
            className="pl-9 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner className="w-8 h-8 text-blue-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pages.map((page) => (
                  <TableRow 
                    key={page.id} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer"
                    onClick={() => router.push(`/pages/${page.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                          <DocumentIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{page.title}</div>
                          <div className="text-xs text-gray-500 font-mono">/{page.slug}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${page.status === 'published' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                          page.status === 'draft' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' : 
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                        {page.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-500 dark:text-gray-400">
                      {page.updatedAt ? format(new Date(page.updatedAt), 'MMM d, yyyy') : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={(e) => handleDelete(page.id, e)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {pages.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-64 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <DocumentIcon className="w-12 h-12 text-gray-300 mb-3" />
                        <p>No pages found</p>
                        <p className="text-xs mt-1">Create a new page to get started</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Create Modal - Inline for simplicity or use Modal component if verified */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Create New Page</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Title</label>
                <Input 
                  autoFocus
                  placeholder="e.g. Home Screen"
                  value={newPageTitle}
                  onChange={(e) => setNewPageTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Slug</label>
                <Input 
                  placeholder="e.g. home-screen"
                  value={newPageSlug}
                  onChange={(e) => setNewPageSlug(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                <Button onClick={handleCreatePage}>Create & Edit</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
