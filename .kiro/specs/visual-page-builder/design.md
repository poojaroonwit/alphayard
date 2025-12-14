# Visual Page Builder Design Document

## Overview

The Visual Page Builder is a comprehensive content management system that enables non-technical users to create, edit, and publish web pages through an intuitive drag-and-drop interface. Similar to Adobe Experience Manager (AEM), this system provides a visual canvas, component library, property panels, templates, and publishing workflows. The system integrates with the existing Bondarys infrastructure (Supabase, Next.js admin console) and provides both a builder interface and a rendering engine for published pages.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Admin Console (Next.js)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Page Builder │  │  Component   │  │  Template    │      │
│  │   Canvas     │  │   Library    │  │   Manager    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Properties  │  │   Version    │  │  Publishing  │      │
│  │    Panel     │  │   Control    │  │   System     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓ ↑
                    REST API / GraphQL
                            ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                  Backend API (Express.js)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Page      │  │  Component   │  │  Template    │      │
│  │  Controller  │  │  Controller  │  │  Controller  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Version    │  │  Publishing  │  │    Asset     │      │
│  │  Controller  │  │  Controller  │  │  Controller  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓ ↑
                      Database Layer
                            ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│              Supabase PostgreSQL Database                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    pages     │  │  components  │  │  templates   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │page_versions │  │page_components│ │    assets    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│              Public Website / Marketing Site                 │
│  ┌──────────────────────────────────────────────────┐       │
│  │         Page Renderer (Server-Side)              │       │
│  │  - Fetches published pages from database         │       │
│  │  - Renders components dynamically                │       │
│  │  - Applies SEO metadata                          │       │
│  │  - Handles responsive layouts                    │       │
│  └──────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend (Admin Console)**
- Next.js 14 with App Router
- React 18 with TypeScript
- TailwindCSS for styling
- React DnD or dnd-kit for drag-and-drop
- TipTap or Slate for rich text editing
- React Query for data fetching and caching

**Backend**
- Express.js with TypeScript
- Supabase PostgreSQL for data storage
- Supabase Storage for asset management
- Node-cron for scheduled publishing
- JSON Schema for component validation

**Rendering Engine**
- Next.js SSR/SSG for public pages
- Dynamic component rendering
- SEO optimization with Next.js metadata API

## Components and Interfaces

### 1. Page Builder Canvas

**Purpose**: Visual editing area where users arrange and configure components

**Key Features**:
- Drag-and-drop interface for adding/reordering components
- Visual indicators for drop zones
- Component selection and highlighting
- Real-time preview of changes
- Responsive viewport switching (mobile/tablet/desktop)
- Undo/redo functionality

**Component Structure**:
```typescript
interface Canvas {
  pageId: string;
  components: ComponentInstance[];
  selectedComponentId: string | null;
  viewport: 'mobile' | 'tablet' | 'desktop';
  isDirty: boolean;
}

interface ComponentInstance {
  id: string;
  componentType: string;
  position: number;
  props: Record<string, any>;
  styles: ComponentStyles;
  responsiveConfig: ResponsiveConfig;
}
```

### 2. Component Library

**Purpose**: Catalog of available components that can be added to pages

**Built-in Components**:
- **Layout Components**: Container, Grid, Flex, Section, Divider
- **Content Components**: Text, Heading, Paragraph, Rich Text, Image, Video, Icon
- **Interactive Components**: Button, Link, Form, Input, Textarea, Select, Checkbox
- **Media Components**: Image Gallery, Video Player, Carousel, Lightbox
- **Marketing Components**: Hero Section, CTA Banner, Feature Grid, Testimonial, Pricing Table
- **Navigation Components**: Header, Footer, Menu, Breadcrumb, Sidebar
- **Data Components**: Table, List, Card Grid, Timeline

**Component Schema**:
```typescript
interface ComponentDefinition {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  schema: ComponentSchema;
  defaultProps: Record<string, any>;
  previewComponent: React.ComponentType;
  renderComponent: React.ComponentType;
}

interface ComponentSchema {
  properties: {
    [key: string]: PropertyDefinition;
  };
  required?: string[];
}

interface PropertyDefinition {
  type: 'string' | 'number' | 'boolean' | 'image' | 'richtext' | 'select' | 'color';
  label: string;
  description?: string;
  default?: any;
  options?: Array<{ label: string; value: any }>;
  validation?: ValidationRule[];
}
```

### 3. Properties Panel

**Purpose**: Interface for configuring selected component properties

**Features**:
- Dynamic form generation based on component schema
- Real-time validation
- Image upload with preview
- Color picker
- Rich text editor integration
- Responsive configuration per breakpoint
- Style controls (spacing, typography, colors)

**Interface**:
```typescript
interface PropertiesPanel {
  componentId: string;
  componentType: string;
  properties: ComponentProperties;
  onPropertyChange: (key: string, value: any) => void;
  onStyleChange: (styles: ComponentStyles) => void;
}

interface ComponentProperties {
  content: Record<string, any>;
  styles: ComponentStyles;
  responsive: ResponsiveConfig;
}

interface ComponentStyles {
  margin?: Spacing;
  padding?: Spacing;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: string;
  fontWeight?: string;
  borderRadius?: string;
  boxShadow?: string;
}

interface ResponsiveConfig {
  mobile?: Partial<ComponentProperties>;
  tablet?: Partial<ComponentProperties>;
  desktop?: Partial<ComponentProperties>;
}
```

### 4. Template System

**Purpose**: Pre-designed page layouts for quick page creation

**Template Structure**:
```typescript
interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail: string;
  components: ComponentInstance[];
  metadata: TemplateMetadata;
  isSystem: boolean;
  createdBy: string;
  createdAt: Date;
}

interface TemplateMetadata {
  pageType: 'landing' | 'blog' | 'product' | 'about' | 'contact' | 'custom';
  tags: string[];
  previewUrl?: string;
}
```

### 5. Publishing System

**Purpose**: Control when and how pages become publicly accessible

**Publishing States**:
- **Draft**: Unpublished, editable
- **Scheduled**: Queued for future publication
- **Published**: Live and accessible
- **Archived**: Unpublished but preserved

**Interface**:
```typescript
interface PublishingConfig {
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  publishedAt?: Date;
  scheduledFor?: Date;
  expiresAt?: Date;
  publishedBy?: string;
  url: string;
  isPublic: boolean;
}

interface PublishingWorkflow {
  requiresApproval: boolean;
  approvers: string[];
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
}
```

### 6. Version Control System

**Purpose**: Track page changes and enable rollback

**Version Structure**:
```typescript
interface PageVersion {
  id: string;
  pageId: string;
  versionNumber: number;
  components: ComponentInstance[];
  metadata: PageMetadata;
  createdBy: string;
  createdAt: Date;
  changeDescription?: string;
}

interface VersionComparison {
  added: ComponentInstance[];
  removed: ComponentInstance[];
  modified: Array<{
    componentId: string;
    changes: PropertyChange[];
  }>;
}

interface PropertyChange {
  property: string;
  oldValue: any;
  newValue: any;
}
```

## Data Models

### Database Schema

```sql
-- Pages table
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES pages(id) ON DELETE SET NULL,
  template_id UUID REFERENCES templates(id),
  status VARCHAR(50) DEFAULT 'draft',
  published_at TIMESTAMP,
  scheduled_for TIMESTAMP,
  expires_at TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  seo_config JSONB DEFAULT '{}'::jsonb
);

-- Page components (junction table)
CREATE TABLE page_components (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  component_type VARCHAR(100) NOT NULL,
  position INTEGER NOT NULL,
  props JSONB DEFAULT '{}'::jsonb,
  styles JSONB DEFAULT '{}'::jsonb,
  responsive_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Component definitions
CREATE TABLE component_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(50) NOT NULL,
  icon VARCHAR(50),
  description TEXT,
  schema JSONB NOT NULL,
  default_props JSONB DEFAULT '{}'::jsonb,
  is_system BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Templates
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  thumbnail VARCHAR(500),
  components JSONB NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_system BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Page versions
CREATE TABLE page_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  components JSONB NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  change_description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(page_id, version_number)
);

-- Page hierarchy (for navigation)
CREATE TABLE page_hierarchy (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  depth INTEGER DEFAULT 0,
  path VARCHAR(1000),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Publishing workflow
CREATE TABLE publishing_workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  requires_approval BOOLEAN DEFAULT false,
  approval_status VARCHAR(50),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Audit log
CREATE TABLE page_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES users(id),
  changes JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_pages_slug ON pages(slug);
CREATE INDEX idx_pages_status ON pages(status);
CREATE INDEX idx_pages_parent_id ON pages(parent_id);
CREATE INDEX idx_page_components_page_id ON page_components(page_id);
CREATE INDEX idx_page_components_position ON page_components(page_id, position);
CREATE INDEX idx_page_versions_page_id ON page_versions(page_id);
CREATE INDEX idx_page_hierarchy_page_id ON page_hierarchy(page_id);
CREATE INDEX idx_page_hierarchy_parent_id ON page_hierarchy(parent_id);
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Component drag-and-drop preserves data
*For any* component type and drop position, dragging a component from the library to the canvas should add the component at the specified position with all default properties intact.
**Validates: Requirements 1.2**

### Property 2: Component reordering preserves all components
*For any* page configuration and reordering operation, reordering components should preserve all components and update only their positions.
**Validates: Requirements 1.3**

### Property 3: Page save and load round-trip
*For any* page with components and configurations, saving the page and then loading it should produce an equivalent page with identical components, configurations, and positions.
**Validates: Requirements 1.4**

### Property 4: Preview matches published rendering
*For any* page configuration, the preview rendering should produce the same output as the published rendering.
**Validates: Requirements 1.5**

### Property 5: Component selection shows correct properties
*For any* component type, selecting a component on the canvas should display a properties panel containing all configurable options defined in that component's schema.
**Validates: Requirements 2.1**

### Property 6: Property changes update canvas
*For any* component and property modification, changing a property value should immediately update the canvas preview to reflect the change.
**Validates: Requirements 2.2**

### Property 7: Image upload round-trip
*For any* valid image file, uploading it through the properties panel should store the image and make it retrievable with the same content.
**Validates: Requirements 2.3**

### Property 8: Text input validation
*For any* text input, the system should validate it according to the component's validation rules and either accept valid input or reject invalid input with an error message.
**Validates: Requirements 2.4**

### Property 9: Style application
*For any* component and style configuration, applying styles should update the component's rendered appearance to match the style settings.
**Validates: Requirements 2.5**

### Property 10: Template selection loads components
*For any* template, selecting it when creating a page should populate the canvas with all components defined in the template with their configured properties.
**Validates: Requirements 3.2**

### Property 11: Template modification isolation
*For any* page created from a template, modifying the page should not affect the original template definition.
**Validates: Requirements 3.3**

### Property 12: Template creation persistence
*For any* valid template definition, creating a template should persist it and make it retrievable by all authorized users.
**Validates: Requirements 3.4**

### Property 13: Viewport switching resizes canvas
*For any* device size (mobile, tablet, desktop), switching to that viewport should resize the canvas to match the device's dimensions.
**Validates: Requirements 4.2**

### Property 14: Responsive breakpoints apply correctly
*For any* component with responsive configurations, viewing the page at different viewport sizes should apply the appropriate configuration for each breakpoint.
**Validates: Requirements 4.3**

### Property 15: Responsive configuration storage
*For any* component, setting different configurations for different breakpoints should store and retrieve each configuration correctly.
**Validates: Requirements 4.4**

### Property 16: Publishing makes pages accessible
*For any* page with a valid URL, publishing the page should make it accessible at that URL to public users.
**Validates: Requirements 5.1**

### Property 17: Scheduled publishing executes at correct time
*For any* page with a scheduled publication time, the system should automatically publish the page at the specified time.
**Validates: Requirements 5.2**

### Property 18: Unpublishing preserves data
*For any* published page, unpublishing it should remove public access while preserving all page data and components.
**Validates: Requirements 5.3**

### Property 19: Expiration unpublishes automatically
*For any* page with an expiration date, the system should automatically unpublish the page after that date.
**Validates: Requirements 5.4**

### Property 20: URL uniqueness enforcement
*For any* page, attempting to publish it with a URL that conflicts with an existing published page should be prevented with an error.
**Validates: Requirements 5.5**

### Property 21: Save creates version
*For any* page save operation, the system should create a new version entry with timestamp and author information.
**Validates: Requirements 6.1**

### Property 22: Version history completeness
*For any* page with multiple saves, retrieving version history should return all versions in chronological order with complete metadata.
**Validates: Requirements 6.2**

### Property 23: Version preview isolation
*For any* page, previewing a previous version should not modify the current published page or its data.
**Validates: Requirements 6.3**

### Property 24: Version restoration creates new version
*For any* historical version, restoring it should create a new version entry rather than overwriting the current version.
**Validates: Requirements 6.4**

### Property 25: Version diff accuracy
*For any* two versions of a page, comparing them should correctly identify all added, removed, and modified components.
**Validates: Requirements 6.5**

### Property 26: Component schema validation
*For any* component schema, the system should validate it against the schema specification and either accept valid schemas or reject invalid ones with specific error messages.
**Validates: Requirements 7.1**

### Property 27: Property definitions generate controls
*For any* component property definition, the system should generate the appropriate form control type based on the property type.
**Validates: Requirements 7.2**

### Property 28: Component rendering in canvas
*For any* registered component, adding it to the canvas should render it using its preview component definition.
**Validates: Requirements 7.3**

### Property 29: Component updates propagate
*For any* component definition update, all pages using that component should reflect the updated definition.
**Validates: Requirements 7.4**

### Property 30: Data binding functionality
*For any* component with data binding configuration, the system should fetch data from the specified source and bind it to the component properties.
**Validates: Requirements 7.5**

### Property 31: Parent page assignment
*For any* page creation, specifying a parent page should correctly establish the hierarchical relationship in the database.
**Validates: Requirements 8.1**

### Property 32: Hierarchy display accuracy
*For any* set of pages with hierarchical relationships, the page tree view should display all pages in their correct hierarchical structure.
**Validates: Requirements 8.2**

### Property 33: Hierarchy move updates dependencies
*For any* page moved in the hierarchy, the system should update the page's URL and all navigation references to reflect the new position.
**Validates: Requirements 8.3**

### Property 34: Navigation reflects hierarchy
*For any* page hierarchy, generated navigation menus should accurately reflect the current hierarchical structure and page order.
**Validates: Requirements 8.5**

### Property 35: SEO validation
*For any* SEO content input, the system should validate character limits and provide feedback on optimization.
**Validates: Requirements 9.2**

### Property 36: Open Graph tag generation
*For any* Open Graph configuration, the system should generate the correct meta tags in the page HTML.
**Validates: Requirements 9.3**

### Property 37: Sitemap generation
*For any* page publication, the system should add an entry to the sitemap with correct URL and metadata.
**Validates: Requirements 9.4**

### Property 38: Canonical URL tag inclusion
*For any* page with a canonical URL set, the system should include the appropriate link tag in the page head.
**Validates: Requirements 9.5**

### Property 39: Permission enforcement
*For any* user action, the system should check the user's permissions and allow or deny the action accordingly.
**Validates: Requirements 10.1**

### Property 40: Draft status for unprivileged saves
*For any* user without publish permissions, saving a page should mark it as draft and not publish it.
**Validates: Requirements 10.2**

### Property 41: Unauthorized action denial and logging
*For any* unauthorized action attempt, the system should deny access and create an audit log entry.
**Validates: Requirements 10.3**

### Property 42: Approval workflow enforcement
*For any* page with approval workflow configured, attempting to publish should require approval from designated approvers.
**Validates: Requirements 10.4**

### Property 43: Audit log completeness
*For any* page action, the system should create an audit log entry with user, timestamp, and action details.
**Validates: Requirements 10.5**

### Property 44: Rich text formatting
*For any* formatting operation in the rich text editor, the system should generate the appropriate HTML tags.
**Validates: Requirements 11.2**

### Property 45: Link validation
*For any* link insertion, the system should validate the URL format and allow configuration of link attributes.
**Validates: Requirements 11.3**

### Property 46: HTML sanitization
*For any* pasted HTML content, the system should remove potentially dangerous tags and attributes while preserving safe formatting.
**Validates: Requirements 11.4**

### Property 47: Rich text image handling
*For any* image inserted in rich text, the system should upload the image and insert it with responsive sizing attributes.
**Validates: Requirements 11.5**

### Property 48: Page duplication completeness
*For any* page, duplicating it should create a new page with all components and their configurations copied.
**Validates: Requirements 12.1**

### Property 49: Duplicate URL uniqueness
*For any* duplicated page, the system should assign a unique URL and set the status to unpublished.
**Validates: Requirements 12.2**

### Property 50: Selective metadata copying
*For any* page duplication, component settings should be copied but page-specific metadata (ID, created date, published status) should not.
**Validates: Requirements 12.3**

### Property 51: Schedule clearing on duplication
*For any* page with scheduled publishing, duplicating it should create a new page without any publication schedule.
**Validates: Requirements 12.4**

### Property 52: Asset reference preservation
*For any* page with uploaded assets, duplicating the page should reference the same assets rather than creating copies.
**Validates: Requirements 12.5**

## Error Handling

### Client-Side Error Handling

**Validation Errors**
- Display inline validation messages for form inputs
- Prevent invalid data submission
- Provide clear guidance on how to fix errors

**Network Errors**
- Implement retry logic with exponential backoff
- Display user-friendly error messages
- Maintain local state to prevent data loss
- Provide offline mode with sync when connection restored

**Component Errors**
- Implement error boundaries to catch React errors
- Display fallback UI for broken components
- Log errors for debugging
- Allow users to continue working with other components

### Server-Side Error Handling

**Database Errors**
- Wrap database operations in try-catch blocks
- Log errors with context for debugging
- Return appropriate HTTP status codes
- Provide meaningful error messages to clients

**Validation Errors**
- Validate all inputs before processing
- Return 400 Bad Request with validation details
- Use JSON Schema for consistent validation

**Authorization Errors**
- Return 401 Unauthorized for authentication failures
- Return 403 Forbidden for permission denials
- Log unauthorized access attempts

**Resource Conflicts**
- Handle unique constraint violations (e.g., duplicate URLs)
- Implement optimistic locking for concurrent edits
- Return 409 Conflict with resolution guidance

### Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId: string;
  };
}
```

## Testing Strategy

### Unit Testing

**Component Testing**
- Test individual React components in isolation
- Test component property validation
- Test component rendering with various props
- Test component event handlers
- Use React Testing Library for component tests

**Service Testing**
- Test API service methods
- Test data transformation logic
- Test validation functions
- Mock external dependencies

**Utility Testing**
- Test helper functions
- Test data formatting functions
- Test URL generation and validation

### Property-Based Testing

**Library**: fast-check (JavaScript/TypeScript property-based testing library)

**Configuration**: Each property-based test should run a minimum of 100 iterations to ensure thorough coverage of the input space.

**Test Tagging**: Each property-based test must include a comment tag in this exact format:
```typescript
// Feature: visual-page-builder, Property {number}: {property_text}
```

**Property Test Examples**:

```typescript
import fc from 'fast-check';

// Feature: visual-page-builder, Property 3: Page save and load round-trip
test('page save and load preserves all data', () => {
  fc.assert(
    fc.property(
      pageArbitrary(),
      async (page) => {
        const savedPage = await pageService.save(page);
        const loadedPage = await pageService.load(savedPage.id);
        expect(loadedPage).toEqual(savedPage);
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: visual-page-builder, Property 11: Template modification isolation
test('modifying page does not affect template', () => {
  fc.assert(
    fc.property(
      templateArbitrary(),
      componentModificationArbitrary(),
      async (template, modification) => {
        const page = await pageService.createFromTemplate(template.id);
        const originalTemplate = await templateService.get(template.id);
        
        await pageService.modifyComponent(page.id, modification);
        
        const templateAfter = await templateService.get(template.id);
        expect(templateAfter).toEqual(originalTemplate);
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: visual-page-builder, Property 20: URL uniqueness enforcement
test('duplicate URLs are prevented', () => {
  fc.assert(
    fc.property(
      pageArbitrary(),
      pageArbitrary(),
      async (page1, page2) => {
        await pageService.publish(page1);
        
        page2.url = page1.url; // Set same URL
        
        await expect(pageService.publish(page2)).rejects.toThrow('URL already exists');
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Testing

**API Integration Tests**
- Test complete API workflows
- Test authentication and authorization
- Test database transactions
- Test file upload and storage

**End-to-End Testing**
- Test complete user workflows (create, edit, publish page)
- Test drag-and-drop interactions
- Test responsive preview switching
- Test version control workflows
- Use Playwright or Cypress for E2E tests

### Performance Testing

**Load Testing**
- Test page rendering performance with many components
- Test database query performance with large datasets
- Test concurrent user editing scenarios

**Optimization Testing**
- Measure bundle size and load times
- Test image optimization and lazy loading
- Test caching effectiveness

## API Endpoints

### Page Management

```
GET    /api/pages                    - List all pages (with filters)
POST   /api/pages                    - Create new page
GET    /api/pages/:id                - Get page by ID
PUT    /api/pages/:id                - Update page
DELETE /api/pages/:id                - Delete page
POST   /api/pages/:id/duplicate      - Duplicate page
GET    /api/pages/:id/preview        - Preview page
POST   /api/pages/:id/publish        - Publish page
POST   /api/pages/:id/unpublish      - Unpublish page
GET    /api/pages/slug/:slug         - Get published page by slug
```

### Component Management

```
GET    /api/components               - List all component definitions
POST   /api/components               - Create component definition
GET    /api/components/:id           - Get component definition
PUT    /api/components/:id           - Update component definition
DELETE /api/components/:id           - Delete component definition
```

### Template Management

```
GET    /api/templates                - List all templates
POST   /api/templates                - Create template
GET    /api/templates/:id            - Get template
PUT    /api/templates/:id            - Update template
DELETE /api/templates/:id            - Delete template
```

### Version Control

```
GET    /api/pages/:id/versions       - Get version history
GET    /api/pages/:id/versions/:versionId - Get specific version
POST   /api/pages/:id/versions/:versionId/restore - Restore version
GET    /api/pages/:id/versions/compare?v1=:id1&v2=:id2 - Compare versions
```

### Asset Management

```
POST   /api/assets/upload            - Upload asset
GET    /api/assets                   - List assets
GET    /api/assets/:id               - Get asset
DELETE /api/assets/:id               - Delete asset
```

### Page Hierarchy

```
GET    /api/pages/hierarchy          - Get page hierarchy tree
PUT    /api/pages/:id/move           - Move page in hierarchy
```

### Publishing Workflow

```
POST   /api/pages/:id/request-approval - Request approval
POST   /api/pages/:id/approve        - Approve page
POST   /api/pages/:id/reject         - Reject page
```

### Audit Log

```
GET    /api/audit-log                - Get audit log entries
GET    /api/audit-log/page/:id       - Get audit log for specific page
```

## Security Considerations

### Authentication
- Use JWT tokens for API authentication
- Implement token refresh mechanism
- Secure token storage in httpOnly cookies

### Authorization
- Implement role-based access control (RBAC)
- Define roles: Super Admin, Admin, Editor, Viewer
- Check permissions on every API request
- Implement row-level security in database

### Input Validation
- Validate all user inputs on both client and server
- Use JSON Schema for API request validation
- Sanitize HTML content to prevent XSS attacks
- Implement rate limiting to prevent abuse

### Data Protection
- Encrypt sensitive data at rest
- Use HTTPS for all communications
- Implement CSRF protection
- Sanitize file uploads and validate file types

### Audit Logging
- Log all page modifications
- Log authentication attempts
- Log authorization failures
- Include IP address and user agent in logs

## Performance Optimizations

### Frontend Optimizations

**Code Splitting**
- Lazy load component library
- Lazy load properties panel
- Split vendor bundles

**Caching**
- Cache component definitions
- Cache templates
- Implement service worker for offline support

**Rendering Optimization**
- Use React.memo for expensive components
- Implement virtual scrolling for long component lists
- Debounce property updates

### Backend Optimizations

**Database Optimization**
- Create indexes on frequently queried columns
- Use database connection pooling
- Implement query result caching with Redis

**API Optimization**
- Implement response compression
- Use CDN for static assets
- Implement API response caching

**Asset Optimization**
- Compress images on upload
- Generate multiple image sizes for responsive images
- Use lazy loading for images

## Deployment Considerations

### Infrastructure
- Deploy admin console as Next.js application
- Deploy backend API as Node.js service
- Use Supabase for database and storage
- Use Redis for caching and session storage

### Scaling
- Horizontal scaling for API servers
- Database read replicas for read-heavy operations
- CDN for static assets and published pages

### Monitoring
- Implement application performance monitoring (APM)
- Set up error tracking (e.g., Sentry)
- Monitor database performance
- Set up alerts for critical errors

### Backup and Recovery
- Automated database backups
- Point-in-time recovery capability
- Asset backup to separate storage

## Future Enhancements

### Advanced Features
- A/B testing for pages
- Personalization based on user segments
- Multi-language support for pages
- Advanced analytics and heatmaps
- Collaboration features (real-time co-editing)
- AI-powered content suggestions
- Advanced SEO analysis and recommendations

### Integration Opportunities
- Integration with marketing automation platforms
- Integration with analytics platforms (Google Analytics, etc.)
- Integration with DAM (Digital Asset Management) systems
- Webhook support for external integrations
- API for headless CMS usage

### Component Enhancements
- Animation and transition builder
- Advanced form builder with conditional logic
- E-commerce components (product listings, cart, checkout)
- Interactive components (quizzes, calculators)
- Video background support
- Parallax scrolling effects

## Migration Strategy

### Phase 1: Foundation (Weeks 1-2)
- Set up database schema
- Implement basic API endpoints
- Create basic admin UI structure

### Phase 2: Core Features (Weeks 3-5)
- Implement drag-and-drop canvas
- Build component library
- Create properties panel
- Implement save/load functionality

### Phase 3: Publishing (Weeks 6-7)
- Implement publishing system
- Create version control
- Build page hierarchy

### Phase 4: Advanced Features (Weeks 8-10)
- Implement templates
- Add responsive preview
- Create rich text editor integration
- Build SEO management

### Phase 5: Polish and Testing (Weeks 11-12)
- Comprehensive testing
- Performance optimization
- Documentation
- User training

## Conclusion

This visual page builder system provides a comprehensive solution for creating and managing web pages without coding knowledge. By implementing drag-and-drop functionality, a rich component library, version control, and publishing workflows, the system enables content editors to create professional web pages while maintaining quality and consistency. The architecture is designed to be scalable, maintainable, and extensible for future enhancements.
