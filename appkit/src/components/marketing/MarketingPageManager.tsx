'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Eye, MoveUp, MoveDown, CheckCircle, Clock, Archive } from 'lucide-react'
import { marketingService, MarketingSlide, MarketingSlideData } from '../../services/marketingService'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

export default function MarketingPageManager() {
  const [slides, setSlides] = useState<MarketingSlide[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSlide, setEditingSlide] = useState<MarketingSlide | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [slideToDelete, setSlideToDelete] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    status: 'published' as 'published' | 'draft' | 'archived',
    priority: 0,
    slideData: {
      title: '',
      subtitle: '',
      description: '',
      icon: 'home',
      gradient: ['#667eea', '#764ba2'],
      features: [] as string[],
      slide_order: 1
    } as MarketingSlideData
  })

  useEffect(() => {
    loadSlides()
  }, [])

  const loadSlides = async () => {
    setLoading(true)
    try {
      const data = await marketingService.getSlides()
      setSlides(data)
    } catch (error) {
      console.error('Error loading slides:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (slide: MarketingSlide | null = null) => {
    if (slide) {
      setEditingSlide(slide)
      setFormData({
        title: slide.title,
        slug: slide.slug,
        status: slide.status,
        priority: slide.priority,
        slideData: { ...slide.slideData }
      })
    } else {
      setEditingSlide(null)
      const nextOrder = slides.length + 1
      setFormData({
        title: '',
        slug: '',
        status: 'published',
        priority: nextOrder,
        slideData: {
          title: '',
          subtitle: '',
          description: '',
          icon: 'home',
          gradient: ['#667eea', '#764ba2'],
          features: [],
          slide_order: nextOrder
        }
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingSlide) {
        await marketingService.updateSlide(editingSlide.id, formData)
      } else {
        await marketingService.createSlide(formData)
      }
      setIsModalOpen(false)
      loadSlides()
    } catch (error) {
      console.error('Error saving slide:', error)
    }
  }

  const handleDelete = async () => {
    if (!slideToDelete) return
    setIsDeleting(true)
    try {
      await marketingService.deleteSlide(slideToDelete)
      setSlideToDelete(null)
      loadSlides()
    } catch (error) {
      console.error('Error deleting slide:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleAddFeature = () => {
    setFormData({
      ...formData,
      slideData: {
        ...formData.slideData,
        features: [...formData.slideData.features, '']
      }
    })
  }

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...formData.slideData.features]
    newFeatures[index] = value
    setFormData({
      ...formData,
      slideData: {
        ...formData.slideData,
        features: newFeatures
      }
    })
  }

  const handleRemoveFeature = (index: number) => {
    setFormData({
      ...formData,
      slideData: {
        ...formData.slideData,
        features: formData.slideData.features.filter((_, i) => i !== index)
      }
    })
  }

  if (loading && slides.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Marketing Page Configuration</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage slides for onboarding and landing pages</p>
        </div>
        <Button 
          onClick={() => handleOpenModal()}
          className="bg-black hover:bg-gray-800 text-white flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add New Slide
        </Button>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider uppercase">Order</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider uppercase">Slide</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider uppercase">Details</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {slides.map((slide) => (
                <tr key={slide.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">#{slide.slideData.slide_order || slide.priority}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-6">
                      {/* Mobile Preview Card */}
                      <div className="relative w-[60px] h-[106px] rounded-[10px] overflow-hidden shadow-sm border border-gray-100 shrink-0 select-none">
                        <div 
                          className="absolute inset-0 flex flex-col items-center justify-center text-white p-1"
                          style={{ 
                            background: `linear-gradient(135deg, ${slide.slideData.gradient[0]}, ${slide.slideData.gradient[1]})` 
                          }}
                        >
                          <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center mb-1">
                             <Eye className="w-2.5 h-2.5" />
                          </div>
                          <div className="text-[5px] font-bold text-center leading-tight mb-0.5 line-clamp-1 w-full px-1">{slide.slideData.title || slide.title}</div>
                          <div className="text-[4px] text-center text-white/80 leading-tight line-clamp-2 w-full px-1">{slide.slideData.subtitle}</div>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{slide.title}</div>
                         <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-[10px] font-mono">/{slide.slug}</span>
                         </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      slide.status === 'published' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-500' 
                        : slide.status === 'draft'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-500'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-500'
                    }`}>
                      {slide.status === 'published' ? <CheckCircle className="w-3 h-3" /> : slide.status === 'draft' ? <Clock className="w-3 h-3" /> : <Archive className="w-3 h-3" />}
                      {(slide.status || 'draft').charAt(0).toUpperCase() + (slide.status || 'draft').slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>Features: {slide.slideData.features.length}</div>
                      <div>Slug: {slide.slug}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleOpenModal(slide)}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-400/10 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          setSlideToDelete(slide.id)
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit/Create Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingSlide ? 'Edit Marketing Slide' : 'Create New Marketing Slide'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Internal Title</label>
              <Input 
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Welcome Slide"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">URL Slug</label>
              <Input 
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g. welcome-slide"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-black">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select 
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:ring-2 focus:ring-blue-500"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Slide Order</label>
              <Input 
                type="number"
                value={formData.slideData.slide_order}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  priority: parseInt(e.target.value),
                  slideData: { ...formData.slideData, slide_order: parseInt(e.target.value) } 
                })}
                required
              />
            </div>
          </div>

          <hr className="border-gray-100 dark:border-zinc-800" />

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Slide Content</h3>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-black">Display Title</label>
              <Input 
                value={formData.slideData.title}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  slideData: { ...formData.slideData, title: e.target.value } 
                })}
                placeholder="Title shown on the slide"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Subtitle</label>
              <Input 
                value={formData.slideData.subtitle}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  slideData: { ...formData.slideData, subtitle: e.target.value } 
                })}
                placeholder="Subtitle shown on the slide"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea 
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                value={formData.slideData.description}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  slideData: { ...formData.slideData, description: e.target.value } 
                })}
                placeholder="Brief description..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Gradient Start</label>
                    <div className="flex gap-2">
                        <Input 
                            type="color"
                            className="w-12 p-1"
                            value={formData.slideData.gradient[0]}
                            onChange={(e) => {
                                const newG = [...formData.slideData.gradient]
                                newG[0] = e.target.value
                                setFormData({ ...formData, slideData: { ...formData.slideData, gradient: newG }})
                            }}
                        />
                        <Input 
                            value={formData.slideData.gradient[0]}
                            onChange={(e) => {
                                const newG = [...formData.slideData.gradient]
                                newG[0] = e.target.value
                                setFormData({ ...formData, slideData: { ...formData.slideData, gradient: newG }})
                            }}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Gradient End</label>
                    <div className="flex gap-2">
                        <Input 
                            type="color"
                            className="w-12 p-1"
                            value={formData.slideData.gradient[1]}
                            onChange={(e) => {
                                const newG = [...formData.slideData.gradient]
                                newG[1] = e.target.value
                                setFormData({ ...formData, slideData: { ...formData.slideData, gradient: newG }})
                            }}
                        />
                        <Input 
                            value={formData.slideData.gradient[1]}
                            onChange={(e) => {
                                const newG = [...formData.slideData.gradient]
                                newG[1] = e.target.value
                                setFormData({ ...formData, slideData: { ...formData.slideData, gradient: newG }})
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-black">
                <label className="text-sm font-medium">Features</label>
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline" 
                  onClick={handleAddFeature}
                  className="h-7 px-2 text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" /> Add Feature
                </Button>
              </div>
              <div className="space-y-2">
                {formData.slideData.features.map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <Input 
                      value={feature}
                      onChange={(e) => handleFeatureChange(index, e.target.value)}
                      placeholder={`Feature ${index + 1}`}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => handleRemoveFeature(index)}
                      className="text-red-500 hover:bg-red-50 p-2 h-auto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-black hover:bg-gray-800 text-white">
              {editingSlide ? 'Update Slide' : 'Create Slide'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!slideToDelete}
        onClose={() => setSlideToDelete(null)}
        title="Delete Marketing Slide"
      >
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Are you sure you want to delete this marketing slide? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setSlideToDelete(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Slide'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
