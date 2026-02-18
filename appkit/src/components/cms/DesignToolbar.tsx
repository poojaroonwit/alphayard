'use client'

import React from 'react'
import { createPortal } from 'react-dom'
import { ContentComponent } from '../../services/productionCmsService'

interface DesignToolbarProps {
  component: ContentComponent
  onUpdate: (id: string, updates: Partial<ContentComponent>) => void
  onDelete: (id: string) => void
  onSelect: (id: string) => void
  mounted: boolean
}

export const DesignToolbar: React.FC<DesignToolbarProps> = ({ 
  component, 
  onUpdate, 
  onDelete, 
  onSelect,
  mounted 
}) => {
  const handleToolbarInteraction = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    // Ensure the element stays selected
    onSelect(component.id)
  }

  const renderToolbar = () => (
    <div 
      className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] bg-white border border-gray-300 rounded-lg shadow-lg p-2 flex items-center space-x-1"
      onClick={handleToolbarInteraction}
      onMouseDown={handleToolbarInteraction}
      onMouseUp={handleToolbarInteraction}
      onPointerDown={handleToolbarInteraction}
      onPointerUp={handleToolbarInteraction}
      style={{ pointerEvents: 'auto' }}
    >
      {/* Typography Dropdown */}
      {(component.type === 'text' || component.type === 'heading' || component.type === 'paragraph' || component.type === 'caption') && (
        <div className="relative group">
          <button className="flex items-center space-x-1 px-3 py-2 text-xs bg-gray-50 hover:bg-gray-100 rounded-md">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            <span className="font-medium">Typography</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 w-48 bg-white border border-gray-300 rounded-lg shadow-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1 text-left">Font Size</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={component.props?.fontSize || 16}
                    onChange={(e) => onUpdate(component.id, { props: { ...component.props, fontSize: parseInt(e.target.value) || 16 } })}
                    className="flex-1 text-xs border border-gray-300 rounded px-2 py-1"
                    placeholder="16"
                    min="8"
                    max="120"
                  />
                  <span className="text-xs text-gray-500">px</span>
                </div>
              </div>
              <div>
                <label htmlFor="font-weight" className="block text-xs font-medium text-gray-700 mb-1 text-left">Font Weight</label>
                <select
                  id="font-weight"
                  value={component.props?.fontWeight || 'normal'}
                  onChange={(e) => onUpdate(component.id, { props: { ...component.props, fontWeight: e.target.value } })}
                  className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                  aria-label="Font weight"
                  title="Select font weight"
                >
                  <option value="normal" style={{ fontWeight: 'normal' }}>Normal</option>
                  <option value="medium" style={{ fontWeight: '500' }}>Medium</option>
                  <option value="semibold" style={{ fontWeight: '600' }}>Semi Bold</option>
                  <option value="bold" style={{ fontWeight: 'bold' }}>Bold</option>
                  <option value="extrabold" style={{ fontWeight: '800' }}>Extra Bold</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1 text-left">Text Align</label>
                <div className="flex space-x-1">
                  <button
                    onClick={() => onUpdate(component.id, { props: { ...component.props, textAlign: 'left' } })}
                    className={`flex-1 p-2 rounded border ${
                      component.props?.textAlign === 'left' ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                    }`}
                    title="Align Left"
                  >
                    <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onUpdate(component.id, { props: { ...component.props, textAlign: 'center' } })}
                    className={`flex-1 p-2 rounded border ${
                      component.props?.textAlign === 'center' ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                    }`}
                    title="Align Center"
                  >
                    <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M8 12h8m-8 6h16" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onUpdate(component.id, { props: { ...component.props, textAlign: 'right' } })}
                    className={`flex-1 p-2 rounded border ${
                      component.props?.textAlign === 'right' ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                    }`}
                    title="Align Right"
                  >
                    <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M12 12h8m-8 6h16" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onUpdate(component.id, { props: { ...component.props, textAlign: 'justify' } })}
                    className={`flex-1 p-2 rounded border ${
                      component.props?.textAlign === 'justify' ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                    }`}
                    title="Justify"
                  >
                    <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="line-height" className="block text-xs font-medium text-gray-700 mb-1 text-left">Line Height</label>
                <select
                  id="line-height"
                  value={component.props?.lineHeight || 1.5}
                  onChange={(e) => onUpdate(component.id, { props: { ...component.props, lineHeight: parseFloat(e.target.value) } })}
                  className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                  aria-label="Line height"
                  title="Select line height"
                >
                  <option value={1} style={{ lineHeight: '1.0' }}>1.0 - Tight</option>
                  <option value={1.2} style={{ lineHeight: '1.2' }}>1.2 - Compact</option>
                  <option value={1.4} style={{ lineHeight: '1.4' }}>1.4 - Comfortable</option>
                  <option value={1.5} style={{ lineHeight: '1.5' }}>1.5 - Standard</option>
                  <option value={1.6} style={{ lineHeight: '1.6' }}>1.6 - Relaxed</option>
                  <option value={1.8} style={{ lineHeight: '1.8' }}>1.8 - Spacious</option>
                  <option value={2} style={{ lineHeight: '2.0' }}>2.0 - Loose</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Colors Dropdown */}
      <div className="relative group">
        <button className="flex items-center space-x-1 px-3 py-2 text-xs bg-gray-50 hover:bg-gray-100 rounded-md">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
          </svg>
          <span className="font-medium">Colors</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 w-48 bg-white border border-gray-300 rounded-lg shadow-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
          <div className="space-y-3">
            {/* Border Color */}
            <div>
              <label htmlFor="border-color" className="block text-xs text-gray-600 mb-1 text-left">Border</label>
              <div className="flex items-center space-x-2">
                <input
                  id="border-color"
                  type="color"
                  value={component.props?.borderColor || '#E5E7EB'}
                  onChange={(e) => onUpdate(component.id, { props: { ...component.props, borderColor: e.target.value } })}
                  className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                  aria-label="Border color"
                  title="Select border color"
                  placeholder="Border color"
                />
                <input
                  type="text"
                  value={component.props?.borderColor || '#E5E7EB'}
                  onChange={(e) => onUpdate(component.id, { props: { ...component.props, borderColor: e.target.value } })}
                  className="flex-1 text-xs border border-gray-300 rounded px-2 py-1"
                  placeholder="#E5E7EB"
                />
              </div>
            </div>
            
            {/* Text Color */}
            {(component.type === 'text' || component.type === 'heading' || component.type === 'paragraph' || component.type === 'caption' || component.type === 'button') && (
              <div>
                <label htmlFor="text-color" className="block text-xs text-gray-600 mb-1 text-left">Text Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    id="text-color"
                    type="color"
                    value={component.props?.color || '#000000'}
                    onChange={(e) => onUpdate(component.id, { props: { ...component.props, color: e.target.value } })}
                    className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                    aria-label="Text color"
                    title="Select text color"
                    placeholder="Text color"
                  />
                  <input
                    type="text"
                    value={component.props?.color || '#000000'}
                    onChange={(e) => onUpdate(component.id, { props: { ...component.props, color: e.target.value } })}
                    className="flex-1 text-xs border border-gray-300 rounded px-2 py-1"
                    placeholder="#000000"
                  />
                </div>
              </div>
            )}
            
            {/* Background Color */}
            {(component.type === 'container' || component.type === 'card' || component.type === 'hero' || component.type === 'button') && (
              <div>
                <label className="block text-xs text-gray-600 mb-1 text-left">Background</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={component.props?.backgroundColor || '#F3F4F6'}
                    onChange={(e) => onUpdate(component.id, { props: { ...component.props, backgroundColor: e.target.value } })}
                    className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={component.props?.backgroundColor || '#F3F4F6'}
                    onChange={(e) => onUpdate(component.id, { props: { ...component.props, backgroundColor: e.target.value } })}
                    className="flex-1 text-xs border border-gray-300 rounded px-2 py-1"
                    placeholder="#F3F4F6"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Layout Dropdown */}
      <div className="relative group">
        <button className="flex items-center space-x-1 px-3 py-2 text-xs bg-gray-50 hover:bg-gray-100 rounded-md">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
          <span className="font-medium">Layout</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 w-48 bg-white border border-gray-300 rounded-lg shadow-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
          <div className="space-y-3">
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1 text-left">Padding</label>
              <div className="grid grid-cols-2 gap-1">
                <input
                  type="number"
                  value={component.props?.paddingX || 0}
                  onChange={(e) => onUpdate(component.id, { props: { ...component.props, paddingX: parseInt(e.target.value) } })}
                  className="text-xs border border-gray-300 rounded px-2 py-1"
                  placeholder="X"
                  aria-label="Padding X"
                  title="Horizontal padding"
                />
                <input
                  type="number"
                  value={component.props?.paddingY || 0}
                  onChange={(e) => onUpdate(component.id, { props: { ...component.props, paddingY: parseInt(e.target.value) } })}
                  className="text-xs border border-gray-300 rounded px-2 py-1"
                  placeholder="Y"
                  aria-label="Padding Y"
                  title="Vertical padding"
                />
              </div>
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1 text-left">Margin</label>
              <div className="grid grid-cols-2 gap-1">
                <input
                  type="number"
                  value={component.props?.marginX || 0}
                  onChange={(e) => onUpdate(component.id, { props: { ...component.props, marginX: parseInt(e.target.value) } })}
                  className="text-xs border border-gray-300 rounded px-2 py-1"
                  placeholder="X"
                  aria-label="Margin X"
                  title="Horizontal margin"
                />
                <input
                  type="number"
                  value={component.props?.marginY || 0}
                  onChange={(e) => onUpdate(component.id, { props: { ...component.props, marginY: parseInt(e.target.value) } })}
                  className="text-xs border border-gray-300 rounded px-2 py-1"
                  placeholder="Y"
                  aria-label="Margin Y"
                  title="Vertical margin"
                />
              </div>
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1 text-left">Border Width</label>
              <input
                type="number"
                value={component.props?.borderWidth || 0}
                onChange={(e) => onUpdate(component.id, { props: { ...component.props, borderWidth: parseInt(e.target.value) } })}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                min="0"
                max="10"
                aria-label="Border width"
                title="Border width in pixels"
                placeholder="0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Effects Dropdown */}
      <div className="relative group">
        <button className="flex items-center space-x-1 px-3 py-2 text-xs bg-gray-50 hover:bg-gray-100 rounded-md">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span className="font-medium">Effects</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 w-64 bg-white border border-gray-300 rounded-lg shadow-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
          <div className="space-y-4">
            {/* Border Radius */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1 text-left">Border Radius</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={component.props?.borderRadius || 0}
                  onChange={(e) => onUpdate(component.id, { props: { ...component.props, borderRadius: parseInt(e.target.value) || 0 } })}
                  className="flex-1 text-xs border border-gray-300 rounded px-2 py-1"
                  placeholder="0"
                  min="0"
                  aria-label="Border radius"
                  title="Border radius in pixels"
                />
                <span className="text-xs text-gray-500">px</span>
              </div>
            </div>

            {/* Opacity */}
            <div>
              <label htmlFor="opacity" className="block text-xs font-medium text-gray-700 mb-1 text-left">Opacity: {Math.round((component.props?.opacity || 1) * 100)}%</label>
              <input
                id="opacity"
                type="range"
                min="0"
                max="100"
                value={(component.props?.opacity || 1) * 100}
                onChange={(e) => onUpdate(component.id, { props: { ...component.props, opacity: parseInt(e.target.value) / 100 } })}
                className="w-full h-2"
                aria-label="Opacity"
                title="Adjust opacity"
              />
            </div>

            {/* Shadow */}
            <div>
              <label htmlFor="shadow" className="block text-xs font-medium text-gray-700 mb-1 text-left">Shadow</label>
              <select
                id="shadow"
                value={component.props?.boxShadow || 'none'}
                onChange={(e) => onUpdate(component.id, { props: { ...component.props, boxShadow: e.target.value } })}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                aria-label="Shadow"
                title="Select shadow effect"
              >
                <option value="none">None</option>
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
                <option value="xl">Extra Large</option>
                <option value="2xl">2X Large</option>
                <option value="inner">Inner</option>
              </select>
            </div>

            {/* Blur */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1 text-left">Blur: {component.props?.blur || 0}px</label>
              <input
                type="range"
                min="0"
                max="20"
                value={component.props?.blur || 0}
                onChange={(e) => onUpdate(component.id, { props: { ...component.props, blur: parseInt(e.target.value) } })}
                className="w-full h-2"
                aria-label="Blur"
                title="Adjust blur effect"
              />
            </div>

            {/* Brightness */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1 text-left">Brightness: {Math.round((component.props?.brightness || 1) * 100)}%</label>
              <input
                type="range"
                min="0"
                max="200"
                value={(component.props?.brightness || 1) * 100}
                onChange={(e) => onUpdate(component.id, { props: { ...component.props, brightness: parseInt(e.target.value) / 100 } })}
                className="w-full h-2"
                aria-label="Brightness"
                title="Adjust brightness"
              />
            </div>

            {/* Contrast */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1 text-left">Contrast: {Math.round((component.props?.contrast || 1) * 100)}%</label>
              <input
                type="range"
                min="0"
                max="200"
                value={(component.props?.contrast || 1) * 100}
                onChange={(e) => onUpdate(component.id, { props: { ...component.props, contrast: parseInt(e.target.value) / 100 } })}
                className="w-full h-2"
                aria-label="Contrast"
                title="Adjust contrast"
              />
            </div>

            {/* Saturation */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1 text-left">Saturation: {Math.round((component.props?.saturation || 1) * 100)}%</label>
              <input
                type="range"
                min="0"
                max="200"
                value={(component.props?.saturation || 1) * 100}
                onChange={(e) => onUpdate(component.id, { props: { ...component.props, saturation: parseInt(e.target.value) / 100 } })}
                className="w-full h-2"
                aria-label="Saturation"
                title="Adjust saturation"
              />
            </div>

            {/* Hue Rotate */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1 text-left">Hue: {component.props?.hueRotate || 0}°</label>
              <input
                type="range"
                min="0"
                max="360"
                value={component.props?.hueRotate || 0}
                onChange={(e) => onUpdate(component.id, { props: { ...component.props, hueRotate: parseInt(e.target.value) } })}
                className="w-full h-2"
                aria-label="Hue rotate"
                title="Adjust hue rotation"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Dropdown */}
      <div className="relative group">
        <button className="flex items-center space-x-1 px-3 py-2 text-xs bg-gray-50 hover:bg-gray-100 rounded-md">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="font-medium">Advanced</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 w-64 bg-white border border-gray-300 rounded-lg shadow-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
          <div className="space-y-4">
            {/* Z-Index */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1 text-left">Z-Index</label>
              <input
                type="number"
                value={component.props?.zIndex || 1}
                onChange={(e) => onUpdate(component.id, { props: { ...component.props, zIndex: parseInt(e.target.value) || 1 } })}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                placeholder="1"
                aria-label="Z-index"
                title="Stacking order"
              />
            </div>

            {/* Position */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1 text-left">Position</label>
              <select
                value={component.props?.position || 'absolute'}
                onChange={(e) => onUpdate(component.id, { props: { ...component.props, position: e.target.value } })}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                aria-label="Position"
                title="Select position type"
              >
                <option value="absolute">Absolute</option>
                <option value="relative">Relative</option>
                <option value="fixed">Fixed</option>
                <option value="static">Static</option>
              </select>
            </div>

            {/* Display */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1 text-left">Display</label>
              <select
                value={component.props?.display || 'block'}
                onChange={(e) => onUpdate(component.id, { props: { ...component.props, display: e.target.value } })}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                aria-label="Display"
                title="Select display type"
              >
                <option value="block">Block</option>
                <option value="inline">Inline</option>
                <option value="inline-block">Inline Block</option>
                <option value="flex">Flex</option>
                <option value="grid">Grid</option>
                <option value="none">None</option>
              </select>
            </div>

            {/* Overflow */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1 text-left">Overflow</label>
              <select
                value={component.props?.overflow || 'visible'}
                onChange={(e) => onUpdate(component.id, { props: { ...component.props, overflow: e.target.value } })}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                aria-label="Overflow"
                title="Select overflow behavior"
              >
                <option value="visible">Visible</option>
                <option value="hidden">Hidden</option>
                <option value="scroll">Scroll</option>
                <option value="auto">Auto</option>
              </select>
            </div>

            {/* Cursor */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1 text-left">Cursor</label>
              <select
                value={component.props?.cursor || 'default'}
                onChange={(e) => onUpdate(component.id, { props: { ...component.props, cursor: e.target.value } })}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                aria-label="Cursor"
                title="Select cursor style"
              >
                <option value="default">Default</option>
                <option value="pointer">Pointer</option>
                <option value="text">Text</option>
                <option value="move">Move</option>
                <option value="not-allowed">Not Allowed</option>
                <option value="grab">Grab</option>
                <option value="grabbing">Grabbing</option>
              </select>
            </div>

            {/* Transition */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1 text-left">Transition</label>
              <input
                type="text"
                value={component.props?.transition || ''}
                onChange={(e) => onUpdate(component.id, { props: { ...component.props, transition: e.target.value } })}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                placeholder="all 0.3s ease"
                aria-label="Transition"
                title="CSS transition properties"
              />
            </div>

            {/* Animation */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1 text-left">Animation</label>
              <select
                value={component.props?.animation || 'none'}
                onChange={(e) => onUpdate(component.id, { props: { ...component.props, animation: e.target.value } })}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                aria-label="Animation"
                title="Select animation effect"
              >
                <option value="none">None</option>
                <option value="pulse">Pulse</option>
                <option value="bounce">Bounce</option>
                <option value="spin">Spin</option>
                <option value="ping">Ping</option>
                <option value="fadeIn">Fade In</option>
                <option value="slideIn">Slide In</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Spacing Dropdown */}
      <div className="relative group">
        <button className="flex items-center space-x-1 px-3 py-2 text-xs bg-gray-50 hover:bg-gray-100 rounded-md">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
          <span className="font-medium">Spacing</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 w-64 bg-white border border-gray-300 rounded-lg shadow-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
          <div className="space-y-4">
            {/* Padding - Individual Sides */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2 text-left">Padding</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Top</label>
                  <input
                    type="number"
                    value={component.props?.paddingTop || 0}
                    onChange={(e) => onUpdate(component.id, { props: { ...component.props, paddingTop: parseInt(e.target.value) || 0 } })}
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Right</label>
                  <input
                    type="number"
                    value={component.props?.paddingRight || 0}
                    onChange={(e) => onUpdate(component.id, { props: { ...component.props, paddingRight: parseInt(e.target.value) || 0 } })}
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Bottom</label>
                  <input
                    type="number"
                    value={component.props?.paddingBottom || 0}
                    onChange={(e) => onUpdate(component.id, { props: { ...component.props, paddingBottom: parseInt(e.target.value) || 0 } })}
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Left</label>
                  <input
                    type="number"
                    value={component.props?.paddingLeft || 0}
                    onChange={(e) => onUpdate(component.id, { props: { ...component.props, paddingLeft: parseInt(e.target.value) || 0 } })}
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Margin - Individual Sides */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2 text-left">Margin</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Top</label>
                  <input
                    type="number"
                    value={component.props?.marginTop || 0}
                    onChange={(e) => onUpdate(component.id, { props: { ...component.props, marginTop: parseInt(e.target.value) || 0 } })}
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Right</label>
                  <input
                    type="number"
                    value={component.props?.marginRight || 0}
                    onChange={(e) => onUpdate(component.id, { props: { ...component.props, marginRight: parseInt(e.target.value) || 0 } })}
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Bottom</label>
                  <input
                    type="number"
                    value={component.props?.marginBottom || 0}
                    onChange={(e) => onUpdate(component.id, { props: { ...component.props, marginBottom: parseInt(e.target.value) || 0 } })}
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Left</label>
                  <input
                    type="number"
                    value={component.props?.marginLeft || 0}
                    onChange={(e) => onUpdate(component.id, { props: { ...component.props, marginLeft: parseInt(e.target.value) || 0 } })}
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Gap (for flex/grid) */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1 text-left">Gap</label>
              <input
                type="number"
                value={component.props?.gap || 0}
                onChange={(e) => onUpdate(component.id, { props: { ...component.props, gap: parseInt(e.target.value) || 0 } })}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                placeholder="0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center space-x-1 border-l border-gray-300 pl-3">
        <button
          onClick={() => {
            const currentTransform = component.props?.transform || ''
            const currentRotation = currentTransform.match(/rotate\((-?\d+)deg\)/)?.[1] || '0'
            const currentAngle = parseInt(currentRotation)
            
            // Cycle through: 0° -> 90° -> 180° -> 270° -> 0°
            let nextAngle = 0
            if (currentAngle === 0) nextAngle = 90
            else if (currentAngle === 90) nextAngle = 180
            else if (currentAngle === 180) nextAngle = 270
            else if (currentAngle === 270) nextAngle = 0
            else nextAngle = 90 // Default to 90° if current angle is not in our cycle
            
            // Update transform, preserving other transform properties
            const otherTransforms = currentTransform.replace(/rotate\(-?\d+deg\)/g, '').trim()
            const newTransform = otherTransforms 
              ? `${otherTransforms} rotate(${nextAngle}deg)`
              : `rotate(${nextAngle}deg)`
            
            onUpdate(component.id, { props: { ...component.props, transform: newTransform } })
          }}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
          title="Rotate (0° → 90° → 180° → 270° → 0°)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        <button
          onClick={() => onUpdate(component.id, { props: { ...component.props, transform: 'scaleX(-1)' } })}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
          title="Flip Horizontal"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
        <button
          onClick={() => onUpdate(component.id, { props: { ...component.props, transform: 'scaleY(-1)' } })}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
          title="Flip Vertical"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>
        <button
          onClick={() => onDelete(component.id)}
          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
          title="Delete Element"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  )

  if (!mounted) return null
  
  return renderToolbar()
}
