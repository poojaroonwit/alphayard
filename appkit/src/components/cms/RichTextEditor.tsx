'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { 
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  ListBulletIcon,
  LinkIcon,
  PhotoIcon,
  VideoCameraIcon,
  SpeakerWaveIcon,
  CodeBracketIcon,
  ChatBubbleLeftRightIcon as QuoteIcon,
  TableCellsIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  LinkSlashIcon,
  Bars3BottomLeftIcon as AlignLeftIcon,
  Bars3Icon as AlignCenterIcon,
  Bars3BottomRightIcon as AlignRightIcon,
  Bars4Icon as AlignJustifyIcon,

  PaintBrushIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline'

// Rich Text Editor Interface
interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
  readOnly?: boolean
  showToolbar?: boolean
  allowMedia?: boolean
  allowTables?: boolean
  allowCode?: boolean
  maxLength?: number
  onMediaUpload?: (file: File) => Promise<string>
  onLinkCreate?: (url: string, text: string) => void
  onLinkEdit?: (url: string, text: string) => void
  onLinkRemove?: () => void
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = 'Start typing...',
  className = '',
  readOnly = false,
  showToolbar = true,
  allowMedia = true,
  allowTables = true,
  allowCode = true,
  maxLength,
  onMediaUpload,
  onLinkCreate,
  onLinkEdit,
  onLinkRemove
}) => {
  // State management
  const [isFocused, setIsFocused] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [showTableModal, setShowTableModal] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')
  const [tableRows, setTableRows] = useState(3)
  const [tableCols, setTableCols] = useState(3)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Refs
  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Focus management
  const focusEditor = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.focus()
    }
  }, [])

  // Command execution
  const executeCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value)
    focusEditor()
    onChange(editorRef.current?.innerHTML || '')
  }, [onChange, focusEditor])

  // Format text
  const formatText = useCallback((format: string) => {
    executeCommand(format)
  }, [executeCommand])

  // Insert content
  const insertContent = useCallback((html: string) => {
    executeCommand('insertHTML', html)
  }, [executeCommand])

  // Handle paste
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    insertContent(text)
  }, [insertContent])

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    
    if (files.length > 0 && allowMedia && onMediaUpload) {
      handleFileUpload(files[0])
    }
  }, [allowMedia, onMediaUpload])

  // File upload handler
  const handleFileUpload = useCallback(async (file: File) => {
    if (!onMediaUpload) return

    try {
      setIsUploading(true)
      setUploadProgress(0)
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 100)

      const url = await onMediaUpload(file)
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      // Insert media based on file type
      if (file.type.startsWith('image/')) {
        insertContent(`<img src="${url}" alt="${file.name}" style="max-width: 100%; height: auto;" />`)
      } else if (file.type.startsWith('video/')) {
        insertContent(`<video controls style="max-width: 100%; height: auto;"><source src="${url}" type="${file.type}"></video>`)
      } else if (file.type.startsWith('audio/')) {
        insertContent(`<audio controls><source src="${url}" type="${file.type}"></audio>`)
      }
      
      setTimeout(() => {
        setIsUploading(false)
        setUploadProgress(0)
      }, 500)
    } catch (error) {
      console.error('Upload failed:', error)
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [onMediaUpload, insertContent])

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onMediaUpload) {
      handleFileUpload(file)
    }
  }, [handleFileUpload, onMediaUpload])

  // Link handlers
  const handleLinkCreate = useCallback(() => {
    if (linkUrl && linkText) {
      insertContent(`<a href="${linkUrl}" target="_blank">${linkText}</a>`)
      setShowLinkModal(false)
      setLinkUrl('')
      setLinkText('')
      onLinkCreate?.(linkUrl, linkText)
    }
  }, [linkUrl, linkText, insertContent, onLinkCreate])

  // Table handlers
  const handleTableCreate = useCallback(() => {
    let tableHtml = '<table border="1" style="border-collapse: collapse; width: 100%;">'
    
    for (let i = 0; i < tableRows; i++) {
      tableHtml += '<tr>'
      for (let j = 0; j < tableCols; j++) {
        tableHtml += '<td style="padding: 8px; border: 1px solid #ccc;">Cell</td>'
      }
      tableHtml += '</tr>'
    }
    
    tableHtml += '</table>'
    insertContent(tableHtml)
    setShowTableModal(false)
  }, [tableRows, tableCols, insertContent])

  // Image handlers
  const handleImageInsert = useCallback((url: string, alt: string = '') => {
    insertContent(`<img src="${url}" alt="${alt}" style="max-width: 100%; height: auto;" />`)
    setShowImageModal(false)
  }, [insertContent])

  // Video handlers
  const handleVideoInsert = useCallback((url: string) => {
    insertContent(`<video controls style="max-width: 100%; height: auto;"><source src="${url}" type="video/mp4"></video>`)
    setShowVideoModal(false)
  }, [insertContent])

  // Content change handler
  const handleContentChange = useCallback(() => {
    const newContent = editorRef.current?.innerHTML || ''
    if (newContent !== content) {
      onChange(newContent)
    }
  }, [content, onChange])

  // Update editor content when prop changes
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content
    }
  }, [content])

  // Toolbar component
  const Toolbar = () => (
    <div className="rich-text-toolbar">
      <div className="toolbar-group">
        <button
          type="button"
          onClick={() => formatText('bold')}
          className="toolbar-btn"
          title="Bold"
          aria-label="Bold"
        >
          <BoldIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => formatText('italic')}
          className="toolbar-btn"
          title="Italic"
          aria-label="Italic"
        >
          <ItalicIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => formatText('underline')}
          className="toolbar-btn"
          title="Underline"
          aria-label="Underline"
        >
          <UnderlineIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="toolbar-separator" />

      <div className="toolbar-group">
        <button
          type="button"
          onClick={() => formatText('insertUnorderedList')}
          className="toolbar-btn"
          title="Bullet List"
          aria-label="Bullet List"
        >
          <ListBulletIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => formatText('insertOrderedList')}
          className="toolbar-btn"
          title="Numbered List"
          aria-label="Numbered List"
        >
          <ListBulletIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="toolbar-separator" />

      <div className="toolbar-group">
        <button
          type="button"
          onClick={() => formatText('justifyLeft')}
          className="toolbar-btn"
          title="Align Left"
          aria-label="Align Left"
        >
          <AlignLeftIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => formatText('justifyCenter')}
          className="toolbar-btn"
          title="Align Center"
          aria-label="Align Center"
        >
          <AlignCenterIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => formatText('justifyRight')}
          className="toolbar-btn"
          title="Align Right"
          aria-label="Align Right"
        >
          <AlignRightIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => formatText('justifyFull')}
          className="toolbar-btn"
          title="Justify"
          aria-label="Justify"
        >
          <AlignJustifyIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="toolbar-separator" />

      <div className="toolbar-group">
        <button
          type="button"
          onClick={() => setShowLinkModal(true)}
          className="toolbar-btn"
          title="Insert Link"
          aria-label="Insert Link"
        >
          <LinkIcon className="h-4 w-4" />
        </button>
        {allowCode && (
          <button
            type="button"
            onClick={() => insertContent('<code>Code</code>')}
            className="toolbar-btn"
            title="Insert Code"
            aria-label="Insert Code"
          >
            <CodeBracketIcon className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => insertContent('<blockquote>Quote</blockquote>')}
          className="toolbar-btn"
          title="Insert Quote"
          aria-label="Insert Quote"
        >
          <QuoteIcon className="h-4 w-4" />
        </button>
      </div>

      {allowMedia && (
        <>
          <div className="toolbar-separator" />
          <div className="toolbar-group">
            <button
              type="button"
              onClick={() => setShowImageModal(true)}
              className="toolbar-btn"
              title="Insert Image"
              aria-label="Insert Image"
            >
              <PhotoIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowVideoModal(true)}
              className="toolbar-btn"
              title="Insert Video"
              aria-label="Insert Video"
            >
              <VideoCameraIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="toolbar-btn"
              title="Upload Media"
              aria-label="Upload Media"
            >
              <CloudArrowUpIcon className="h-4 w-4" />
            </button>
          </div>
        </>
      )}

      {allowTables && (
        <>
          <div className="toolbar-separator" />
          <div className="toolbar-group">
            <button
              type="button"
              onClick={() => setShowTableModal(true)}
              className="toolbar-btn"
              title="Insert Table"
              aria-label="Insert Table"
            >
              <TableCellsIcon className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
    </div>
  )

  return (
    <div className={`rich-text-editor ${className} ${isFocused ? 'focused' : ''}`}>
      {showToolbar && <Toolbar />}
      
      <div
        ref={editorRef}
        contentEditable={!readOnly}
        className="rich-text-content"
        onInput={handleContentChange}
        onPaste={handlePaste}
        onDrop={handleDrop}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        data-placeholder={placeholder}
        style={{ minHeight: '200px' }}
        suppressContentEditableWarning
      />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,audio/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Upload progress */}
      {isUploading && (
        <div className="upload-progress">
          <div className="upload-progress-bar">
            <div 
              className="upload-progress-fill"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <span className="upload-progress-text">Uploading... {uploadProgress}%</span>
        </div>
      )}

      {/* Character count */}
      {maxLength && (
        <div className="character-count">
          {content.length} / {maxLength} characters
        </div>
      )}

      {/* Link Modal */}
      {showLinkModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex items-center space-x-3 mb-4">
              <LinkIcon className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Insert Link</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link Text
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className="content-input w-full"
                  placeholder="Link text"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="content-input w-full"
                  placeholder="https://example.com"
                />
              </div>
            </div>
            <div className="flex space-x-3 justify-end mt-6">
              <button
                onClick={() => setShowLinkModal(false)}
                className="content-button content-button-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleLinkCreate}
                className="content-button content-button-primary"
              >
                Insert Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex items-center space-x-3 mb-4">
              <PhotoIcon className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Insert Image</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  className="content-input w-full"
                  placeholder="https://example.com/image.jpg"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const url = (e.target as HTMLInputElement).value
                      if (url) handleImageInsert(url)
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alt Text
                </label>
                <input
                  type="text"
                  className="content-input w-full"
                  placeholder="Alternative text for accessibility"
                />
              </div>
            </div>
            <div className="flex space-x-3 justify-end mt-6">
              <button
                onClick={() => setShowImageModal(false)}
                className="content-button content-button-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="content-button content-button-primary"
              >
                Upload Image
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {showVideoModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex items-center space-x-3 mb-4">
              <VideoCameraIcon className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Insert Video</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video URL
                </label>
                <input
                  type="url"
                  className="content-input w-full"
                  placeholder="https://example.com/video.mp4"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const url = (e.target as HTMLInputElement).value
                      if (url) handleVideoInsert(url)
                    }
                  }}
                />
              </div>
            </div>
            <div className="flex space-x-3 justify-end mt-6">
              <button
                onClick={() => setShowVideoModal(false)}
                className="content-button content-button-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="content-button content-button-primary"
              >
                Upload Video
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Modal */}
      {showTableModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex items-center space-x-3 mb-4">
              <TableCellsIcon className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Insert Table</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rows
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={tableRows}
                    onChange={(e) => setTableRows(parseInt(e.target.value))}
                    className="content-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Columns
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={tableCols}
                    onChange={(e) => setTableCols(parseInt(e.target.value))}
                    className="content-input w-full"
                  />
                </div>
              </div>
            </div>
            <div className="flex space-x-3 justify-end mt-6">
              <button
                onClick={() => setShowTableModal(false)}
                className="content-button content-button-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleTableCreate}
                className="content-button content-button-primary"
              >
                Insert Table
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Rich Text Editor Styles (to be added to CSS)
export const richTextEditorStyles = `
.rich-text-editor {
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  background: white;
  transition: border-color 0.2s;
}

.rich-text-editor.focused {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.rich-text-toolbar {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 0.5rem 0.5rem 0 0;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.toolbar-separator {
  width: 1px;
  height: 1.5rem;
  background: #d1d5db;
  margin: 0 0.5rem;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  background: transparent;
  border-radius: 0.25rem;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.toolbar-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.toolbar-btn:active {
  background: #d1d5db;
}

.rich-text-content {
  padding: 1rem;
  min-height: 200px;
  outline: none;
  line-height: 1.6;
}

.rich-text-content:empty:before {
  content: attr(data-placeholder);
  color: #9ca3af;
  pointer-events: none;
}

.rich-text-content img {
  max-width: 100%;
  height: auto;
  border-radius: 0.375rem;
  margin: 0.5rem 0;
}

.rich-text-content video {
  max-width: 100%;
  height: auto;
  border-radius: 0.375rem;
  margin: 0.5rem 0;
}

.rich-text-content audio {
  width: 100%;
  margin: 0.5rem 0;
}

.rich-text-content table {
  width: 100%;
  border-collapse: collapse;
  margin: 0.5rem 0;
}

.rich-text-content table td,
.rich-text-content table th {
  border: 1px solid #d1d5db;
  padding: 0.5rem;
  text-align: left;
}

.rich-text-content blockquote {
  border-left: 4px solid #3b82f6;
  padding-left: 1rem;
  margin: 1rem 0;
  font-style: italic;
  color: #6b7280;
}

.rich-text-content code {
  background: #f3f4f6;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-Circle: 'Courier New', monospace;
  font-size: 0.875rem;
}

.upload-progress {
  padding: 0.75rem;
  background: #f3f4f6;
  border-top: 1px solid #e5e7eb;
}

.upload-progress-bar {
  width: 100%;
  height: 0.5rem;
  background: #e5e7eb;
  border-radius: 0.25rem;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.upload-progress-fill {
  height: 100%;
  background: #3b82f6;
  transition: width 0.3s ease;
}

.upload-progress-text {
  font-size: 0.875rem;
  color: #6b7280;
}

.character-count {
  padding: 0.5rem 1rem;
  text-align: right;
  font-size: 0.875rem;
  color: #6b7280;
  border-top: 1px solid #e5e7eb;
}

.component-wrapper {
  position: relative;
  border: 2px solid transparent;
  border-radius: 0.5rem;
  transition: border-color 0.2s;
}

.component-wrapper:hover {
  border-color: #e5e7eb;
}

.component-selected {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.component-controls {
  position: absolute;
  top: -2rem;
  right: 0;
  display: flex;
  gap: 0.25rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.25rem;
  padding: 0.25rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border: none;
  background: transparent;
  border-radius: 0.25rem;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.control-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.editor-canvas {
  max-width: 100%;
  margin: 0 auto;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.editor-desktop {
  max-width: 1200px;
}

.editor-tablet {
  max-width: 768px;
}

.editor-mobile {
  max-width: 375px;
}

.editor-content {
  padding: 2rem;
}

.empty-editor {
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
}

.notification {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 50;
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  max-width: 400px;
}

.notification-success {
  background: #d1fae5;
  border: 1px solid #a7f3d0;
  color: #065f46;
}

.notification-error {
  background: #fee2e2;
  border: 1px solid #fecaca;
  color: #991b1b;
}

.notification-warning {
  background: #fef3c7;
  border: 1px solid #fde68a;
  color: #92400e;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal-content {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.content-button {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
  text-decoration: none;
}

.content-button-primary {
  background: #3b82f6;
  color: white;
}

.content-button-primary:hover {
  background: #2563eb;
}

.content-button-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.content-button-secondary:hover {
  background: #e5e7eb;
}

.content-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.content-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
`

