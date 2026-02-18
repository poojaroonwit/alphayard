'use client'

import React from 'react'
import { ContentComponent } from '../../services/productionCmsService'

interface ContentRendererProps {
  component: ContentComponent
  isSelected: boolean
}

export const ContentRenderer: React.FC<ContentRendererProps> = ({ component, isSelected }) => {
  const props = component.props || {}
  
  switch (component.type) {
    case 'text':
      return (
        <div
          style={{
            fontSize: props.fontSize || 16,
            color: props.color || '#000000',
            fontFamily: props.fontFamily || 'inherit',
            lineHeight: props.lineHeight || 1.5,
            textAlign: props.textAlign || 'left',
            padding: '8px',
            minHeight: '20px'
          }}
        >
          {props.content || 'Enter your text here...'}
        </div>
      )

    case 'heading':
      const HeadingTag = props.level || 'h2'
      return (
        <HeadingTag
          style={{
            fontSize: props.fontSize || 24,
            color: props.color || '#000000',
            fontFamily: props.fontFamily || 'inherit',
            fontWeight: props.fontWeight || 'bold',
            textAlign: props.textAlign || 'left',
            margin: 0,
            padding: '8px',
            minHeight: '30px'
          }}
        >
          {props.content || 'Heading'}
        </HeadingTag>
      )

    case 'image':
      return (
        <div className="relative w-full h-full">
          {props.src ? (
            <img
              src={props.src}
              alt={props.alt || ''}
              style={{
                width: '100%',
                height: '100%',
                objectFit: props.objectFit || 'cover',
                borderRadius: props.borderRadius || 0
              }}
              className="block"
            />
          ) : (
            <div
              className="border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-500 w-full h-full"
              style={{
                minHeight: '100px'
              }}
            >
              <div className="text-center">
                <svg className="h-12 w-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                <p className="text-sm">No image selected</p>
              </div>
            </div>
          )}
        </div>
      )

    case 'button':
      return (
        <button
          style={{
            backgroundColor: props.backgroundColor || '#3B82F6',
            color: props.color || '#FFFFFF',
            padding: `${props.paddingY || 12}px ${props.paddingX || 24}px`,
            borderRadius: props.borderRadius || 6,
            fontSize: props.fontSize || 16,
            fontWeight: props.fontWeight || 'medium',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-block',
            width: '100%',
            height: '100%',
            minHeight: '40px'
          }}
          onClick={(e) => {
            e.stopPropagation()
            if (props.href) {
              window.open(props.href, '_blank')
            }
          }}
        >
          {props.text || 'Click me'}
        </button>
      )

    case 'container':
      return (
        <div
          style={{
            backgroundColor: props.backgroundColor || '#F3F4F6',
            padding: props.padding || 20,
            borderRadius: props.borderRadius || 8,
            border: props.border ? `1px solid ${props.borderColor || '#E5E7EB'}` : 'none',
            minHeight: '100px',
            width: '100%',
            height: '100%'
          }}
        >
          <div className="text-gray-500 text-sm">Container</div>
        </div>
      )

    case 'spacer':
      return (
        <div
          style={{
            height: '100%',
            backgroundColor: isSelected ? '#E5E7EB' : 'transparent',
            border: isSelected ? '1px dashed #9CA3AF' : 'none',
            minHeight: '20px'
          }}
        />
      )

    case 'divider':
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <hr
            style={{
              border: 'none',
              borderTop: `${props.thickness || 1}px solid ${props.color || '#E5E7EB'}`,
              width: '100%',
              margin: 0
            }}
          />
        </div>
      )

    case 'paragraph':
      return (
        <div
          style={{
            fontSize: props.fontSize || 14,
            color: props.color || '#374151',
            fontFamily: props.fontFamily || 'inherit',
            lineHeight: props.lineHeight || 1.6,
            textAlign: props.textAlign || 'left',
            padding: '8px',
            minHeight: '20px'
          }}
        >
          {props.content || 'This is a paragraph...'}
        </div>
      )

    case 'video':
      return (
        <div className="relative w-full h-full">
          {props.src ? (
            <video
              src={props.src}
              controls
              style={{
                width: '100%',
                height: '100%',
                objectFit: props.objectFit || 'cover',
                borderRadius: props.borderRadius || 0
              }}
              className="block"
            />
          ) : (
            <div
              className="border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-500 w-full h-full"
              style={{
                minHeight: '150px'
              }}
            >
              <div className="text-center">
                <svg className="h-12 w-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                </svg>
                <p className="text-sm">No video selected</p>
              </div>
            </div>
          )}
        </div>
      )

    case 'audio':
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded">
          {props.src ? (
            <audio
              src={props.src}
              controls
              style={{
                width: '100%',
                height: '50px'
              }}
            />
          ) : (
            <div className="text-center text-gray-500">
              <svg className="h-8 w-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.814L4.617 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.617l3.766-3.814A1 1 0 019.383 3.076zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
              </svg>
              <p className="text-sm">No audio selected</p>
            </div>
          )}
        </div>
      )

    case 'link':
      return (
        <a
          href={props.href || '#'}
          style={{
            color: props.color || '#3B82F6',
            textDecoration: 'underline',
            fontSize: props.fontSize || 16,
            padding: '8px',
            display: 'inline-block'
          }}
          onClick={(e) => {
            e.stopPropagation()
            if (props.href) {
              window.open(props.href, '_blank')
            }
          }}
        >
          {props.text || 'Link text'}
        </a>
      )

    case 'list':
      const ListTag = props.type === 'number' ? 'ol' : 'ul'
      return (
        <ListTag
          style={{
            padding: '8px 8px 8px 24px',
            margin: 0,
            fontSize: props.fontSize || 14,
            color: props.color || '#374151'
          }}
        >
          {(props.items || ['Item 1', 'Item 2', 'Item 3']).map((item: string, index: number) => (
            <li key={index}>{item}</li>
          ))}
        </ListTag>
      )

    case 'quote':
      return (
        <blockquote
          style={{
            fontSize: props.fontSize || 18,
            color: props.color || '#374151',
            fontStyle: 'italic',
            padding: '16px',
            borderLeft: '4px solid #E5E7EB',
            margin: 0,
            backgroundColor: '#F9FAFB'
          }}
        >
          <p style={{ margin: 0, marginBottom: props.author ? '8px' : 0 }}>
            {props.content || 'This is a quote...'}
          </p>
          {props.author && (
            <cite style={{ fontSize: '14px', color: '#6B7280' }}>
              — {props.author}
            </cite>
          )}
        </blockquote>
      )

    case 'table':
      return (
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: props.fontSize || 14
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#F3F4F6' }}>
              {(props.headers || ['Header 1', 'Header 2', 'Header 3']).map((header: string, index: number) => (
                <th
                  key={index}
                  style={{
                    border: '1px solid #E5E7EB',
                    padding: '8px',
                    textAlign: 'left',
                    fontWeight: 'bold'
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: props.rows || 3 }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: props.columns || 3 }).map((_, colIndex) => (
                  <td
                    key={colIndex}
                    style={{
                      border: '1px solid #E5E7EB',
                      padding: '8px'
                    }}
                  >
                    Cell {rowIndex + 1}-{colIndex + 1}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )

    case 'code':
      return (
        <pre
          style={{
            backgroundColor: '#1F2937',
            color: '#F9FAFB',
            padding: '16px',
            borderRadius: '6px',
            fontSize: props.fontSize || 14,
            fontFamily: 'Monaco, Consolas, "Courier New", monospace',
            overflow: 'auto',
            margin: 0,
            width: '100%',
            height: '100%',
            minHeight: '100px'
          }}
        >
          <code>{props.content || 'console.log("Hello World");'}</code>
        </pre>
      )

    case 'caption':
      return (
        <div
          style={{
            fontSize: props.fontSize || 12,
            color: props.color || '#6B7280',
            fontStyle: props.italic ? 'italic' : 'normal',
            textAlign: props.textAlign || 'center',
            padding: '4px 8px',
            minHeight: '16px'
          }}
        >
          {props.content || 'Image caption...'}
        </div>
      )

    case 'gallery':
      return (
        <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center">
          <div className="text-center text-gray-500">
            <svg className="h-8 w-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <p className="text-sm">Image Gallery</p>
          </div>
        </div>
      )

    case 'iframe':
      return (
        <div className="w-full h-full border border-gray-300 rounded flex items-center justify-center bg-gray-50">
          <div className="text-center text-gray-500">
            <svg className="h-8 w-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 1v10h10V5H5z" clipRule="evenodd" />
            </svg>
            <p className="text-sm">Embed Content</p>
          </div>
        </div>
      )

    case 'form':
      return (
        <div className="w-full h-full p-4 bg-white border border-gray-300 rounded">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900">Contact Form</h3>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Name"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                disabled
              />
              <input
                type="email"
                placeholder="Email"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                disabled
              />
              <button
                className="w-full px-4 py-2 bg-blue-600 text-white rounded text-sm"
                disabled
              >
                {props.submitText || 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )

    case 'accordion':
      return (
        <div className="w-full h-full p-4 bg-white border border-gray-300 rounded">
          <div className="space-y-2">
            {(props.items || [{ title: 'Section 1', content: 'Content here...' }]).map((item: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded">
                <div className="p-3 bg-gray-50 font-medium text-sm">
                  {item.title}
                </div>
                <div className="p-3 text-sm text-gray-600">
                  {item.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      )

    case 'tabs':
      return (
        <div className="w-full h-full bg-white border border-gray-300 rounded">
          <div className="flex border-b border-gray-200">
            {(props.tabs || [{ title: 'Tab 1', content: 'Content here...' }]).map((tab: any, index: number) => (
              <div key={index} className="px-4 py-2 text-sm font-medium text-gray-600 border-b-2 border-blue-600">
                {tab.title}
              </div>
            ))}
          </div>
          <div className="p-4 text-sm text-gray-600">
            {(props.tabs || [{ content: 'Content here...' }])[0]?.content}
          </div>
        </div>
      )

    case 'columns':
      return (
        <div
          className="w-full h-full flex gap-4 p-4"
          style={{ gap: props.gap || 20 }}
        >
          {Array.from({ length: props.columns || 2 }).map((_, index) => (
            <div key={index} className="flex-1 bg-gray-100 rounded p-3 text-sm text-gray-600">
              Column {index + 1}
            </div>
          ))}
        </div>
      )

    case 'card':
      return (
        <div
          className="w-full h-full p-4 bg-white rounded border"
          style={{
            boxShadow: props.shadow ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'
          }}
        >
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            {props.title || 'Card Title'}
          </h3>
          <p className="text-sm text-gray-600">
            {props.content || 'Card content...'}
          </p>
        </div>
      )

    case 'hero':
      return (
        <div
          className="w-full h-full flex items-center justify-center text-white rounded relative"
          style={{
            backgroundImage: props.backgroundImage ? `url(${props.backgroundImage})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">
              {props.title || 'Hero Title'}
            </h1>
            <p className="text-lg opacity-90">
              {props.subtitle || 'Hero subtitle'}
            </p>
          </div>
        </div>
      )

    case 'timeline':
      return (
        <div className="w-full h-full p-4 bg-white border border-gray-300 rounded">
          <div className="space-y-4">
            {(props.events || [{ date: '2024', title: 'Event', description: 'Description' }]).map((event: any, index: number) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-3 h-3 bg-blue-600 rounded-full mt-1 flex-shrink-0"></div>
                <div>
                  <div className="text-xs text-gray-500">{event.date}</div>
                  <div className="text-sm font-medium text-gray-900">{event.title}</div>
                  <div className="text-xs text-gray-600">{event.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )

    case 'faq':
      return (
        <div className="w-full h-full p-4 bg-white border border-gray-300 rounded">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900 mb-3">FAQ</h3>
            {(props.questions || [{ q: 'Question?', a: 'Answer...' }]).map((faq: any, index: number) => (
              <div key={index} className="border-b border-gray-200 pb-2">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {faq.q}
                </div>
                <div className="text-xs text-gray-600">
                  {faq.a}
                </div>
              </div>
            ))}
          </div>
        </div>
      )

    case 'testimonial':
      return (
        <div className="w-full h-full p-4 bg-gray-50 border border-gray-300 rounded">
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-3 italic">
              "{props.quote || 'Great service!'}"
            </div>
            <div className="text-xs font-medium text-gray-900">
              {props.author || 'John Doe'}
            </div>
            <div className="text-xs text-gray-500">
              {props.role || 'Customer'}
            </div>
          </div>
        </div>
      )

    case 'pricing':
      return (
        <div className="w-full h-full p-4 bg-white border border-gray-300 rounded">
          <div className="space-y-3">
            {(props.plans || [{ name: 'Basic', price: '$9', features: ['Feature 1'] }]).map((plan: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded p-3">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {plan.name}
                </div>
                <div className="text-lg font-bold text-gray-900 mb-2">
                  {plan.price}
                </div>
                <ul className="text-xs text-gray-600 space-y-1">
                  {plan.features.map((feature: string, fIndex: number) => (
                    <li key={fIndex}>• {feature}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )

    case 'navbar':
      return (
        <div className="w-full h-full bg-white border border-gray-300 rounded flex items-center justify-between px-4">
          <div className="text-sm font-medium text-gray-900">
            {props.logo || 'Logo'}
          </div>
          <div className="flex space-x-4">
            {(props.links || ['Home', 'About', 'Contact']).map((link: string, index: number) => (
              <span key={index} className="text-xs text-gray-600">
                {link}
              </span>
            ))}
          </div>
        </div>
      )

    case 'breadcrumb':
      return (
        <div className="w-full h-full flex items-center px-4 bg-gray-50 border border-gray-300 rounded">
          <div className="flex items-center space-x-2 text-xs text-gray-600">
            {(props.items || ['Home', 'Category', 'Page']).map((item: string, index: number) => (
              <div key={index} className="flex items-center">
                <span>{item}</span>
                {index < (props.items || []).length - 1 && (
                  <svg className="w-3 h-3 mx-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>
      )

    case 'pagination':
      return (
        <div className="w-full h-full flex items-center justify-center space-x-2 bg-white border border-gray-300 rounded">
          <button className="px-2 py-1 text-xs border border-gray-300 rounded">‹</button>
          <span className="px-2 py-1 text-xs bg-blue-600 text-white rounded">
            {props.currentPage || 1}
          </span>
          <span className="px-2 py-1 text-xs text-gray-600">
            of {props.totalPages || 5}
          </span>
          <button className="px-2 py-1 text-xs border border-gray-300 rounded">›</button>
        </div>
      )

    case 'social':
      return (
        <div className="w-full h-full flex items-center justify-center space-x-3 bg-white border border-gray-300 rounded">
          {(props.platforms || ['facebook', 'twitter', 'instagram']).map((platform: string, index: number) => (
            <div key={index} className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-xs text-gray-600">{platform[0].toUpperCase()}</span>
            </div>
          ))}
        </div>
      )

    case 'share':
      return (
        <div className="w-full h-full flex items-center justify-center space-x-2 bg-white border border-gray-300 rounded">
          <span className="text-xs text-gray-600 mr-2">Share:</span>
          {(props.platforms || ['facebook', 'twitter', 'linkedin']).map((platform: string, index: number) => (
            <button key={index} className="px-2 py-1 text-xs bg-blue-600 text-white rounded">
              {platform}
            </button>
          ))}
        </div>
      )

    case 'newsletter':
      return (
        <div className="w-full h-full p-4 bg-white border border-gray-300 rounded">
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              {props.title || 'Subscribe'}
            </h3>
            <div className="flex space-x-2">
              <input
                type="email"
                placeholder={props.placeholder || 'Enter email...'}
                className="flex-1 px-3 py-2 border border-gray-300 rounded text-xs"
                disabled
              />
              <button className="px-4 py-2 bg-blue-600 text-white rounded text-xs">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      )

    default:
      return (
        <div className="p-4 border border-gray-300 rounded bg-gray-50 w-full h-full flex items-center justify-center">
          <p className="text-gray-600 text-sm">Unsupported component: {component.type}</p>
        </div>
      )
  }
}

