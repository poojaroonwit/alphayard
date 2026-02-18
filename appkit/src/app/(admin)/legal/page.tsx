'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye,
  Archive,
  CheckCircle,
  Clock,
  Globe,
  Shield,
  Book,
  Users,
  Search,
  Filter,
  MoreHorizontal,
  ChevronDown,
  AlertCircle,
  Check,
  X,
  ExternalLink,
  Copy,
} from 'lucide-react';
import {
  LegalDocument,
  DeveloperDoc,
  getLegalDocuments,
  createLegalDocument,
  updateLegalDocument,
  deleteLegalDocument,
  publishLegalDocument,
  archiveLegalDocument,
  getDeveloperDocs,
  createDeveloperDoc,
  updateDeveloperDoc,
  deleteDeveloperDoc,
} from '@/services/legalService';

type TabType = 'legal' | 'developer';

const documentTypeLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  terms: { label: 'Terms of Service', icon: <FileText className="w-4 h-4" />, color: 'bg-blue-500' },
  privacy: { label: 'Privacy Policy', icon: <Shield className="w-4 h-4" />, color: 'bg-green-500' },
  developer_guide: { label: 'Developer Guide', icon: <Book className="w-4 h-4" />, color: 'bg-purple-500' },
  community_guidelines: { label: 'Community Guidelines', icon: <Users className="w-4 h-4" />, color: 'bg-orange-500' },
  cookie_policy: { label: 'Cookie Policy', icon: <Globe className="w-4 h-4" />, color: 'bg-yellow-500' },
  eula: { label: 'EULA', icon: <FileText className="w-4 h-4" />, color: 'bg-red-500' },
  custom: { label: 'Custom', icon: <FileText className="w-4 h-4" />, color: 'bg-gray-500' },
};

const statusColors: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-800',
  published: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-600',
  deprecated: 'bg-red-100 text-red-800',
};

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-red-100 text-red-800',
};

export default function LegalPage() {
  const [activeTab, setActiveTab] = useState<TabType>('legal');
  const [legalDocs, setLegalDocs] = useState<LegalDocument[]>([]);
  const [developerDocs, setDeveloperDocs] = useState<DeveloperDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<LegalDocument | DeveloperDoc | null>(null);
  
  // Form states
  const [formData, setFormData] = useState<Partial<LegalDocument | DeveloperDoc>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'legal') {
        const docs = await getLegalDocuments();
        setLegalDocs(docs);
      } else {
        const docs = await getDeveloperDocs();
        setDeveloperDocs(docs);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    if (activeTab === 'legal') {
      setFormData({
        type: 'terms',
        title: '',
        slug: '',
        content: '',
        contentFormat: 'markdown',
        status: 'draft',
        version: '1.0',
        language: 'en',
        isRequiredAcceptance: false,
        requiresReacceptance: false,
        showInApp: true,
        showInFooter: true,
      });
    } else {
      setFormData({
        category: 'getting_started',
        title: '',
        slug: '',
        content: '',
        contentFormat: 'markdown',
        status: 'draft',
        version: '1.0',
        difficultyLevel: 'beginner',
        isFeatured: false,
      });
    }
    setShowCreateModal(true);
  };

  const handleEdit = (doc: LegalDocument | DeveloperDoc) => {
    setSelectedDocument(doc);
    setFormData(doc);
    setShowEditModal(true);
  };

  const handlePreview = (doc: LegalDocument | DeveloperDoc) => {
    setSelectedDocument(doc);
    setShowPreviewModal(true);
  };

  const handleDelete = (doc: LegalDocument | DeveloperDoc) => {
    setSelectedDocument(doc);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selectedDocument) return;
    
    try {
      if (activeTab === 'legal') {
        await deleteLegalDocument(selectedDocument.id);
      } else {
        await deleteDeveloperDoc(selectedDocument.id);
      }
      await loadData();
    } catch (error) {
      console.error('Error deleting document:', error);
    } finally {
      setShowDeleteConfirm(false);
      setSelectedDocument(null);
    }
  };

  const handlePublish = async (doc: LegalDocument) => {
    try {
      await publishLegalDocument(doc.id);
      await loadData();
    } catch (error) {
      console.error('Error publishing document:', error);
    }
  };

  const handleArchive = async (doc: LegalDocument) => {
    try {
      await archiveLegalDocument(doc.id);
      await loadData();
    } catch (error) {
      console.error('Error archiving document:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (showCreateModal) {
        if (activeTab === 'legal') {
          await createLegalDocument(formData as Partial<LegalDocument>);
        } else {
          await createDeveloperDoc(formData as Partial<DeveloperDoc>);
        }
      } else if (showEditModal && selectedDocument) {
        if (activeTab === 'legal') {
          await updateLegalDocument(selectedDocument.id, formData as Partial<LegalDocument>);
        } else {
          await updateDeveloperDoc(selectedDocument.id, formData as Partial<DeveloperDoc>);
        }
      }
      
      await loadData();
      setShowCreateModal(false);
      setShowEditModal(false);
      setSelectedDocument(null);
      setFormData({});
    } catch (error) {
      console.error('Error saving document:', error);
    } finally {
      setSaving(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const filteredLegalDocs = legalDocs.filter(doc => {
    if (searchQuery && !doc.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterStatus !== 'all' && doc.status !== filterStatus) return false;
    if (filterType !== 'all' && doc.type !== filterType) return false;
    return true;
  });

  const filteredDeveloperDocs = developerDocs.filter(doc => {
    if (searchQuery && !doc.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterStatus !== 'all' && doc.status !== filterStatus) return false;
    if (filterType !== 'all' && doc.category !== filterType) return false;
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Legal & Documentation</h1>
          <p className="text-gray-600 mt-1">Manage Terms, Privacy Policy, and Developer Guidelines</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          Create Document
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('legal')}
          className={`pb-3 px-4 font-medium transition ${
            activeTab === 'legal'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Legal Documents
          </div>
        </button>
        <button
          onClick={() => setActiveTab('developer')}
          className={`pb-3 px-4 font-medium transition ${
            activeTab === 'developer'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Book className="w-4 h-4" />
            Developer Docs
          </div>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          title="Filter by status"
          aria-label="Filter by status"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>

        {activeTab === 'legal' && (
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            title="Filter by document type"
            aria-label="Filter by document type"
          >
            <option value="all">All Types</option>
            <option value="terms">Terms of Service</option>
            <option value="privacy">Privacy Policy</option>
            <option value="community_guidelines">Community Guidelines</option>
            <option value="cookie_policy">Cookie Policy</option>
            <option value="eula">EULA</option>
          </select>
        )}

        {activeTab === 'developer' && (
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            title="Filter by category"
            aria-label="Filter by category"
          >
            <option value="all">All Categories</option>
            <option value="getting_started">Getting Started</option>
            <option value="api">API Reference</option>
            <option value="sdk">SDK</option>
            <option value="best_practices">Best Practices</option>
          </select>
        )}
      </div>

      {/* Documents List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : activeTab === 'legal' ? (
        <div className="space-y-4">
          {filteredLegalDocs.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No legal documents</h3>
              <p className="text-gray-600 mt-1">Create your first legal document to get started.</p>
            </div>
          ) : (
            filteredLegalDocs.map((doc) => (
              <LegalDocumentCard
                key={doc.id}
                document={doc}
                onEdit={() => handleEdit(doc)}
                onPreview={() => handlePreview(doc)}
                onDelete={() => handleDelete(doc)}
                onPublish={() => handlePublish(doc)}
                onArchive={() => handleArchive(doc)}
              />
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDeveloperDocs.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Book className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No developer docs</h3>
              <p className="text-gray-600 mt-1">Create your first developer documentation.</p>
            </div>
          ) : (
            filteredDeveloperDocs.map((doc) => (
              <DeveloperDocCard
                key={doc.id}
                document={doc}
                onEdit={() => handleEdit(doc)}
                onPreview={() => handlePreview(doc)}
                onDelete={() => handleDelete(doc)}
              />
            ))
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <DocumentModal
          isOpen={showCreateModal || showEditModal}
          onClose={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
            setSelectedDocument(null);
            setFormData({});
          }}
          title={showCreateModal ? 'Create Document' : 'Edit Document'}
          formData={formData}
          setFormData={setFormData}
          onSave={handleSave}
          saving={saving}
          type={activeTab}
          generateSlug={generateSlug}
        />
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedDocument && (
        <PreviewModal
          isOpen={showPreviewModal}
          onClose={() => {
            setShowPreviewModal(false);
            setSelectedDocument(null);
          }}
          document={selectedDocument}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold">Delete Document</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete &quot;{selectedDocument?.title}&quot;? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Legal Document Card Component
function LegalDocumentCard({
  document,
  onEdit,
  onPreview,
  onDelete,
  onPublish,
  onArchive,
}: {
  document: LegalDocument;
  onEdit: () => void;
  onPreview: () => void;
  onDelete: () => void;
  onPublish: () => void;
  onArchive: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const typeInfo = documentTypeLabels[document.type] || documentTypeLabels.custom;

  return (
    <div className="bg-white border rounded-lg p-4 hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-lg ${typeInfo.color} text-white`}>
            {typeInfo.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{document.title}</h3>
              <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[document.status]}`}>
                {document.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">{typeInfo.label}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span>Version {document.version}</span>
              <span>•</span>
              <span>{document.language.toUpperCase()}</span>
              {document.isRequiredAcceptance && (
                <>
                  <span>•</span>
                  <span className="text-orange-600">Required Acceptance</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onPreview}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
            title="Preview"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={onEdit}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
              title="More options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg py-1 min-w-[150px] z-10">
                {document.status === 'draft' && (
                  <button
                    onClick={() => { onPublish(); setShowMenu(false); }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Publish
                  </button>
                )}
                {document.status === 'published' && (
                  <button
                    onClick={() => { onArchive(); setShowMenu(false); }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                  >
                    <Archive className="w-4 h-4 text-gray-600" />
                    Archive
                  </button>
                )}
                <button
                  onClick={() => { onDelete(); setShowMenu(false); }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Developer Doc Card Component
function DeveloperDocCard({
  document,
  onEdit,
  onPreview,
  onDelete,
}: {
  document: DeveloperDoc;
  onEdit: () => void;
  onPreview: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-white border rounded-lg p-4 hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg bg-purple-500 text-white">
            <Book className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{document.title}</h3>
              <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[document.status]}`}>
                {document.status}
              </span>
              {document.isFeatured && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                  Featured
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">{document.category.replace('_', ' ')}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              {document.difficultyLevel && (
                <span className={`px-2 py-0.5 text-xs rounded-full ${difficultyColors[document.difficultyLevel]}`}>
                  {document.difficultyLevel}
                </span>
              )}
              {document.estimatedReadTime && (
                <span>{document.estimatedReadTime} min read</span>
              )}
              <span>{document.viewCount} views</span>
              <span>👍 {document.helpfulCount}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onPreview}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
            title="Preview"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={onEdit}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-lg transition"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Document Modal Component
function DocumentModal({
  isOpen,
  onClose,
  title,
  formData,
  setFormData,
  onSave,
  saving,
  type,
  generateSlug,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  formData: any;
  setFormData: (data: any) => void;
  onSave: () => void;
  saving: boolean;
  type: TabType;
  generateSlug: (title: string) => string;
}) {
  if (!isOpen) return null;

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setFormData({
      ...formData,
      title: newTitle,
      slug: generateSlug(newTitle),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {type === 'legal' ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={formData.type || 'terms'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    title="Document type"
                    aria-label="Document type"
                  >
                    <option value="terms">Terms of Service</option>
                    <option value="privacy">Privacy Policy</option>
                    <option value="community_guidelines">Community Guidelines</option>
                    <option value="cookie_policy">Cookie Policy</option>
                    <option value="eula">EULA</option>
                    <option value="developer_guide">Developer Guide</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status || 'draft'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    title="Document status"
                    aria-label="Document status"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={handleTitleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter document title"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                  <input
                    type="text"
                    value={formData.slug || ''}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="url-friendly-slug"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
                  <input
                    type="text"
                    value={formData.version || '1.0'}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="1.0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Summary</label>
                <input
                  type="text"
                  value={formData.summary || ''}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of the document"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content (Markdown)</label>
                <textarea
                  value={formData.content || ''}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[300px] font-mono text-sm"
                  placeholder="Enter markdown content..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isRequiredAcceptance || false}
                    onChange={(e) => setFormData({ ...formData, isRequiredAcceptance: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Require Acceptance</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.showInApp || false}
                    onChange={(e) => setFormData({ ...formData, showInApp: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Show in App</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.showInFooter || false}
                    onChange={(e) => setFormData({ ...formData, showInFooter: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Show in Footer</span>
                </label>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={formData.category || 'getting_started'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    title="Document category"
                    aria-label="Document category"
                  >
                    <option value="getting_started">Getting Started</option>
                    <option value="api">API Reference</option>
                    <option value="sdk">SDK</option>
                    <option value="best_practices">Best Practices</option>
                    <option value="guides">Guides</option>
                    <option value="tutorials">Tutorials</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                  <select
                    value={formData.difficultyLevel || 'beginner'}
                    onChange={(e) => setFormData({ ...formData, difficultyLevel: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    title="Difficulty level"
                    aria-label="Difficulty level"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={handleTitleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter document title"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                  <input
                    type="text"
                    value={formData.slug || ''}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="url-friendly-slug"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Read Time (min)</label>
                  <input
                    type="number"
                    value={formData.estimatedReadTime || 5}
                    onChange={(e) => setFormData({ ...formData, estimatedReadTime: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    title="Estimated read time in minutes"
                    placeholder="5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
                <input
                  type="text"
                  value={formData.excerpt || ''}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description for listings"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content (Markdown)</label>
                <textarea
                  value={formData.content || ''}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[300px] font-mono text-sm"
                  placeholder="Enter markdown content..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status || 'draft'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    title="Document status"
                    aria-label="Document status"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                    <option value="deprecated">Deprecated</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 mt-6">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured || false}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                      className="rounded"
                      title="Featured document"
                      aria-label="Featured document"
                    />
                    <span className="text-sm text-gray-700">Featured Document</span>
                  </label>
                </div>
              </div>
            </>
          )}
        </div>
        
        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Preview Modal Component
function PreviewModal({
  isOpen,
  onClose,
  document,
}: {
  isOpen: boolean;
  onClose: () => void;
  document: LegalDocument | DeveloperDoc;
}) {
  if (!isOpen) return null;

  // Simple markdown to HTML conversion (basic)
  const renderMarkdown = (content: string) => {
    if (!content) return '';
    
    let html = content
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-6 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
      // Bold
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      // Code blocks
      .replace(/```(\w+)?\n([\s\S]*?)```/gim, '<pre class="bg-gray-100 p-4 rounded-lg overflow-x-auto my-4"><code>$2</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/gim, '<code class="bg-gray-100 px-1 rounded">$1</code>')
      // Lists
      .replace(/^\- (.*$)/gim, '<li class="ml-4">$1</li>')
      // Line breaks
      .replace(/\n/gim, '<br />');
    
    return html;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-semibold">{document.title}</h2>
            <p className="text-sm text-gray-500">Preview</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(document.content) }}
          />
        </div>
        
        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
