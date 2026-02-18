
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { pageService, Page } from '@/services/pageService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { 
  MegaphoneIcon, 
  DocumentTextIcon, 
  PhotoIcon, 
  Square2StackIcon, 
  CursorArrowRaysIcon,
  ListBulletIcon,
  QueueListIcon,
  ArrowsUpDownIcon,
  MinusIcon,
  VideoCameraIcon,
  DevicePhoneMobileIcon,
  DeviceTabletIcon,
  ComputerDesktopIcon,
  ArrowLeftIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline'
import { 
  IdentificationIcon 
} from '@heroicons/react/24/outline'

interface ComponentSchema {
  id: string;
  componentType: string;
  position: number;
  props: Record<string, any>;
  styles?: Record<string, any>;
}

const COMPONENT_TYPES = [
  { type: 'hero', label: 'Hero', icon: MegaphoneIcon, description: 'Banner with text' },
  { type: 'text', label: 'Text', icon: DocumentTextIcon, description: 'Rich text block' },
  { type: 'image', label: 'Image', icon: PhotoIcon, description: 'Single image' },
  { type: 'card', label: 'Card', icon: IdentificationIcon, description: 'Content card' },
  { type: 'list', label: 'List', icon: ListBulletIcon, description: 'Item list' },
  { type: 'button', label: 'Button', icon: CursorArrowRaysIcon, description: 'Action button' },
  { type: 'spacer', label: 'Spacer', icon: ArrowsUpDownIcon, description: 'Vertical space' },
  { type: 'divider', label: 'Divider', icon: MinusIcon, description: 'Separator line' },
];

export default function PageEditor() {
  const params = useParams();
  const router = useRouter();
  const [page, setPage] = useState<Page | null>(null);
  const [components, setComponents] = useState<ComponentSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');

  useEffect(() => {
    if (params && params.id) {
      fetchPage(params.id as string);
    }
  }, [params]);

  const fetchPage = async (id: string) => {
    try {
      setLoading(true);
      const data = await pageService.getById(id);
      setPage(data);
      // Ensure components is an array and sorted
      const comps = (data.components || []).sort((a: any, b: any) => a.position - b.position);
      
      // Map backend fields to frontend schema if needed
      // Backend: component_type, Frontend: componentType
      // pageService.getById returns API objects. 
      // If API returns snake_case, I map it.
      // Based on PageBuilderController, it returns json_build_object with 'component_type'.
      // So I need to map it.
      const mappedComps = comps.map((c: any) => ({
        id: c.id,
        componentType: c.componentType || c.component_type,
        position: c.position,
        props: c.props || {},
        styles: c.styles || {}
      }));
      setComponents(mappedComps);
    } catch (error) {
      console.error('Failed to load page', error);
      // toast.error('Failed to load page');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!page) return;
    try {
      setSaving(true);
      // Save page details if needed (not implemented here yet)
      
      // Save components
      // Prepare payload: array of { componentType, position, props, styles }
      const payload = components.map((c, index) => ({
        componentType: c.componentType,
        position: index,
        props: c.props,
        styles: c.styles
      }));

      // We need a specific endpoint to save components or use updatePage
      // PageService.update calls PUT /pages/:id with body.
      // PageBuilderController.updatePage handles `components` array in body.
      await pageService.update(page.id, {
        components: payload
      });
      
      // Refresh to get new IDs if created? 
      // Actually Controller replaces all components.
      await fetchPage(page.id);
      alert('Saved successfully');
    } catch (error) {
      console.error('Failed to save', error);
      alert('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const addComponent = (type: string) => {
    const newComp: ComponentSchema = {
      id: `temp_${Date.now()}`,
      componentType: type,
      position: components.length,
      props: getDefaultProps(type)
    };
    setComponents([...components, newComp]);
    setSelectedComponentId(newComp.id);
  };

  const removeComponent = (id: string) => {
    setComponents(components.filter(c => c.id !== id));
    if (selectedComponentId === id) setSelectedComponentId(null);
  };

  const moveComponent = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === components.length - 1) return;

    const newComps = [...components];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newComps[index], newComps[swapIndex]] = [newComps[swapIndex], newComps[index]];
    setComponents(newComps);
  };

  const updateComponentProps = (id: string, newProps: Record<string, any>) => {
    setComponents(components.map(c => 
      c.id === id ? { ...c, props: { ...c.props, ...newProps } } : c
    ));
  };

  const getDefaultProps = (type: string) => {
    switch(type) {
      case 'text': return { content: 'Lorem ipsum dolor sit amet...' };
      case 'hero': return { title: 'Welcome', subtitle: 'Subtitle text', imageUrl: '' };
      case 'button': return { label: 'Click Me', action: 'none' };
      case 'spacer': return { height: '20px' };
      default: return {};
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><LoadingSpinner /></div>;
  if (!page) return <div className="p-8 text-center">Page not found</div>;

  const selectedComponent = components.find(c => c.id === selectedComponentId);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Toolbar */}
      <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/pages')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500">
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-semibold text-gray-900 dark:text-white">{page.title}</h1>
            <div className="text-xs text-gray-500 font-mono">/{page.slug}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
            <button 
              onClick={() => setPreviewMode('mobile')}
              className={`p-2 rounded ${previewMode === 'mobile' ? 'bg-white dark:bg-gray-600 shadow' : 'text-gray-500'}`}
            >
              <DevicePhoneMobileIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setPreviewMode('tablet')}
              className={`p-2 rounded ${previewMode === 'tablet' ? 'bg-white dark:bg-gray-600 shadow' : 'text-gray-500'}`}
            >
              <DeviceTabletIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setPreviewMode('desktop')}
              className={`p-2 rounded ${previewMode === 'desktop' ? 'bg-white dark:bg-gray-600 shadow' : 'text-gray-500'}`}
            >
              <ComputerDesktopIcon className="w-5 h-5" />
            </button>
          </div>
          
          <Button onClick={handleSave} disabled={saving} className="min-w-[100px]">
            {saving ? <LoadingSpinner className="w-4 h-4" /> : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Components Library */}
        <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto p-4 shrink-0">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Components</h3>
          <div className="grid grid-cols-1 gap-2">
            {COMPONENT_TYPES.map(type => (
              <button
                key={type.type}
                onClick={() => addComponent(type.type)}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-all text-left group"
              >
                <type.icon className="w-5 h-5 text-gray-500 group-hover:text-blue-500" />
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600">{type.label}</div>
                  <div className="text-[10px] text-gray-400">{type.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-gray-100 dark:bg-gray-950 overflow-y-auto p-8 flex justify-center">
          <div 
            className={`bg-white transition-all duration-300 shadow-xl min-h-[800px] border border-gray-200 ${
              previewMode === 'mobile' ? 'w-[375px]' : 
              previewMode === 'tablet' ? 'w-[768px]' : 'w-[1200px]'
            }`}
          >
            {components.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8">
                <Square2StackIcon className="w-16 h-16 opacity-20 mb-4" />
                <p>Drag components here or click to add from library</p>
              </div>
            ) : (
               <div className="p-4 space-y-2">
                 {components.map((comp, index) => (
                   <div 
                    key={comp.id} 
                    onClick={() => setSelectedComponentId(comp.id)}
                    className={`relative group border-2 rounded-lg transition-all ${
                      selectedComponentId === comp.id 
                        ? 'border-blue-500 ring-2 ring-blue-500/20' 
                        : 'border-transparent hover:border-blue-300'
                    }`}
                   >
                     {/* Overlay Controls */}
                     <div className={`absolute right-2 top-2 flex bg-white shadow-sm rounded-md overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity z-10 ${selectedComponentId === comp.id ? 'opacity-100' : ''}`}>
                       <button onClick={(e) => { e.stopPropagation(); moveComponent(index, 'up') }} className="p-1.5 hover:bg-gray-100 border-r" title="Move Up"><ArrowUpIcon className="w-3 h-3" /></button>
                       <button onClick={(e) => { e.stopPropagation(); moveComponent(index, 'down') }} className="p-1.5 hover:bg-gray-100 border-r" title="Move Down"><ArrowDownIcon className="w-3 h-3" /></button>
                       <button onClick={(e) => { e.stopPropagation(); removeComponent(comp.id) }} className="p-1.5 hover:bg-red-50 text-red-500" title="Delete"><TrashIcon className="w-3 h-3" /></button>
                     </div>

                     <ComponentRenderer component={comp} />
                   </div>
                 ))}
               </div>
            )}
          </div>
        </div>

        {/* Properties Panel */}
        <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto p-4 shrink-0">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Properties</h3>
          
          {selectedComponent ? (
            <div className="space-y-4">
               <div className="pb-4 border-b border-gray-100 dark:border-gray-700">
                 <label className="text-xs font-mono text-gray-400">ID: {selectedComponent.id}</label>
                 <div className="font-medium text-lg capitalize">{selectedComponent.componentType}</div>
               </div>
               
               {/* Dynamic Props Form based on type */}
               {/* Simple Key-Value for now */}
               {Object.entries(selectedComponent.props).map(([key, value]) => (
                 <div key={key}>
                   <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block capitalize">{key}</label>
                   <Input 
                    value={value} 
                    onChange={(e) => updateComponentProps(selectedComponent.id, { [key]: e.target.value })}
                   />
                 </div>
               ))}
               
               <div className="pt-4 mt-8 border-t border-gray-100">
                 <Button variant="outline" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => removeComponent(selectedComponent.id)}>
                   Delete Component
                 </Button>
               </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500 text-center mt-10">
              Select a component to edit its properties
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ComponentRenderer({ component }: { component: ComponentSchema }) {
  const { componentType, props } = component;
  
  // Basic rendering mapping
  switch (componentType) {
    case 'hero':
      return (
        <div className="bg-gray-900 text-white p-8 rounded text-center" style={component.styles}>
          <h2 className="text-3xl font-bold mb-2">{props.title}</h2>
          <p className="text-gray-300">{props.subtitle}</p>
        </div>
      );
    case 'text':
      return (
        <div className="p-4 prose dark:prose-invert max-w-none" style={component.styles}>
          {props.content}
        </div>
      );
    case 'button':
      return (
        <div className="p-4 text-center" style={component.styles}>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            {props.label}
          </button>
        </div>
      );
    case 'image':
      return (
        <div className="p-4" style={component.styles}>
           {props.imageUrl ? (
             <img src={props.imageUrl} alt="preview" className="w-full h-auto rounded" />
           ) : (
             <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400 rounded">
               Image Placeholder
             </div>
           )}
        </div>
      );
    case 'spacer':
      return <div style={{ height: props.height || '20px', ...component.styles }}></div>;
    case 'divider':
      return <hr className="my-4 border-gray-300 dark:border-gray-700" style={component.styles} />;
    default:
      return (
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded border border-dashed border-gray-300" style={component.styles}>
          <span className="font-mono text-xs">{componentType}</span>
           <pre className="text-[10px] mt-1 overflow-hidden">{JSON.stringify(props, null, 2)}</pre>
        </div>
      );
  }
}
