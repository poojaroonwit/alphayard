# Page Builder API Playground

Interactive examples for building pages via the API.

## Quick Start

### 1. Get Your Token

```bash
curl -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Save the token:
```bash
export TOKEN="your-token-here"
```

### 2. Create Sample Pages

```bash
cd backend/examples
node create-sample-pages.js
```

This creates 4 ready-to-use pages:
- Landing page (/)
- About page (/about)
- Features page (/features)
- Contact page (/contact)

---

## Example 1: Simple Text Page

```bash
curl -X POST http://localhost:3000/api/page-builder/pages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Privacy Policy",
    "slug": "privacy",
    "description": "Our privacy policy",
    "components": [
      {
        "componentType": "Heading",
        "position": 0,
        "props": {
          "text": "Privacy Policy",
          "level": "h1",
          "align": "center"
        }
      },
      {
        "componentType": "Text",
        "position": 1,
        "props": {
          "text": "<p>Your privacy is important to us...</p>",
          "align": "left"
        }
      }
    ]
  }'
```

---

## Example 2: Landing Page with Hero

```bash
curl -X POST http://localhost:3000/api/page-builder/pages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Product Launch",
    "slug": "launch",
    "components": [
      {
        "componentType": "Hero",
        "position": 0,
        "props": {
          "heading": "Introducing Our New Product",
          "subheading": "The future is here",
          "ctaText": "Learn More",
          "ctaUrl": "/features"
        },
        "styles": {
          "backgroundColor": "#4ECDC4",
          "textColor": "#ffffff"
        }
      },
      {
        "componentType": "FeatureGrid",
        "position": 1,
        "props": {
          "title": "Key Features",
          "features": [
            {
              "icon": "⚡",
              "title": "Fast",
              "description": "Lightning fast performance"
            },
            {
              "icon": "🔒",
              "title": "Secure",
              "description": "Bank-level security"
            },
            {
              "icon": "📱",
              "title": "Mobile",
              "description": "Works everywhere"
            }
          ]
        }
      }
    ]
  }'
```

---

## Example 3: Blog Post

```bash
curl -X POST http://localhost:3000/api/page-builder/pages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "10 Tips for Family Safety",
    "slug": "blog/family-safety-tips",
    "description": "Essential tips to keep your family safe",
    "seoConfig": {
      "title": "10 Tips for Family Safety | Bondarys Blog",
      "description": "Learn the top 10 tips for keeping your family safe in today's world",
      "keywords": ["family safety", "safety tips", "parenting"]
    },
    "components": [
      {
        "componentType": "Container",
        "position": 0,
        "props": {
          "maxWidth": "md",
          "padding": "lg"
        }
      },
      {
        "componentType": "Heading",
        "position": 0,
        "props": {
          "text": "10 Tips for Family Safety",
          "level": "h1"
        }
      },
      {
        "componentType": "Image",
        "position": 1,
        "props": {
          "src": "/images/family-safety.jpg",
          "alt": "Family safety tips",
          "width": "full"
        }
      },
      {
        "componentType": "Text",
        "position": 2,
        "props": {
          "text": "<p>Keeping your family safe is a top priority...</p><h2>1. Stay Connected</h2><p>Always know where your family members are...</p>",
          "align": "left"
        }
      }
    ]
  }'
```

---

## Example 4: Using a Template

### Step 1: Get Available Templates

```bash
curl http://localhost:3000/api/page-builder/templates \
  -H "Authorization: Bearer $TOKEN"
```

### Step 2: Get Template Details

```bash
curl http://localhost:3000/api/page-builder/templates/TEMPLATE_ID \
  -H "Authorization: Bearer $TOKEN"
```

### Step 3: Create Page from Template

```bash
# Use the template's components structure
curl -X POST http://localhost:3000/api/page-builder/pages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My New Page",
    "slug": "my-new-page",
    "templateId": "TEMPLATE_ID",
    "components": [
      // Copy components from template and customize
    ]
  }'
```

---

## Example 5: Page with Responsive Design

```bash
curl -X POST http://localhost:3000/api/page-builder/pages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Responsive Page",
    "slug": "responsive",
    "components": [
      {
        "componentType": "Grid",
        "position": 0,
        "props": {
          "columns": 3,
          "gap": "md"
        },
        "responsiveConfig": {
          "mobile": {
            "props": {
              "columns": 1
            }
          },
          "tablet": {
            "props": {
              "columns": 2
            }
          }
        }
      }
    ]
  }'
```

---

## Example 6: Update a Page

```bash
# Get page ID first
PAGE_ID="your-page-id"

curl -X PUT http://localhost:3000/api/page-builder/pages/$PAGE_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "description": "Updated description",
    "components": [
      {
        "componentType": "Heading",
        "position": 0,
        "props": {
          "text": "Updated Content",
          "level": "h1"
        }
      }
    ]
  }'
```

---

## Example 7: Publish a Page

```bash
PAGE_ID="your-page-id"

curl -X POST http://localhost:3000/api/page-builder/pages/$PAGE_ID/publish \
  -H "Authorization: Bearer $TOKEN"
```

---

## Example 8: Schedule a Page

```bash
PAGE_ID="your-page-id"

curl -X POST http://localhost:3000/api/page-builder/pages/$PAGE_ID/schedule \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "scheduledFor": "2025-12-25T00:00:00Z",
    "expiresAt": "2026-01-01T00:00:00Z"
  }'
```

---

## Example 9: Duplicate a Page

```bash
PAGE_ID="your-page-id"

curl -X POST http://localhost:3000/api/page-builder/pages/$PAGE_ID/duplicate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "newSlug": "duplicated-page"
  }'
```

---

## Example 10: View Version History

```bash
PAGE_ID="your-page-id"

curl http://localhost:3000/api/page-builder/pages/$PAGE_ID/versions \
  -H "Authorization: Bearer $TOKEN"
```

---

## Example 11: Restore Previous Version

```bash
PAGE_ID="your-page-id"
VERSION_ID="version-id"

curl -X POST http://localhost:3000/api/page-builder/pages/$PAGE_ID/versions/$VERSION_ID/restore \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "changeDescription": "Restored to previous version"
  }'
```

---

## Example 12: Upload an Image

```bash
curl -X POST http://localhost:3000/api/page-builder/assets/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/image.jpg" \
  -F "folder=pages"
```

---

## Example 13: Create Custom Component

```bash
curl -X POST http://localhost:3000/api/page-builder/components \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Testimonial",
    "category": "marketing",
    "icon": "💬",
    "description": "Customer testimonial component",
    "schema": {
      "properties": {
        "quote": {
          "type": "richtext",
          "label": "Quote",
          "required": true
        },
        "author": {
          "type": "string",
          "label": "Author Name",
          "required": true
        },
        "role": {
          "type": "string",
          "label": "Author Role"
        },
        "avatar": {
          "type": "image",
          "label": "Author Photo"
        }
      }
    },
    "defaultProps": {
      "quote": "<p>This product changed my life!</p>",
      "author": "John Doe",
      "role": "Customer"
    }
  }'
```

---

## Example 14: Create Template from Page

```bash
PAGE_ID="your-page-id"

curl -X POST http://localhost:3000/api/page-builder/templates/from-page \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pageId": "'$PAGE_ID'",
    "name": "My Custom Template",
    "description": "Template created from my page",
    "category": "custom"
  }'
```

---

## Example 15: Get Publishing Statistics

```bash
curl http://localhost:3000/api/page-builder/publishing/stats \
  -H "Authorization: Bearer $TOKEN"
```

---

## Available Components

Use these component types in your pages:

### Layout Components
- `Container` - Content container with max-width
- `Grid` - Grid layout
- `Section` - Section with background
- `Flex` - Flexbox layout

### Content Components
- `Heading` - Heading text (h1-h4)
- `Text` - Rich text content
- `Image` - Image with caption
- `Video` - Video player

### Interactive Components
- `Button` - Call-to-action button
- `Link` - Text link
- `Form` - Form container
- `Input` - Form input

### Marketing Components
- `Hero` - Hero section
- `FeatureGrid` - Feature grid
- `Testimonial` - Customer testimonial
- `CTA` - Call-to-action banner

---

## Tips & Best Practices

### 1. Use Semantic Slugs
```
Good: /blog/family-safety-tips
Bad: /page-123
```

### 2. Add SEO Config
Always include title, description, and keywords for better SEO.

### 3. Use Responsive Config
Configure different layouts for mobile, tablet, and desktop.

### 4. Version Control
Pages are automatically versioned on every save. Use version history to rollback if needed.

### 5. Test Before Publishing
Use the preview endpoint to test pages before publishing.

### 6. Organize with Folders
Use slug prefixes to organize pages:
- `/blog/*` for blog posts
- `/products/*` for product pages
- `/help/*` for help articles

---

## Troubleshooting

### Error: "URL already exists"
```bash
# Check existing pages
curl http://localhost:3000/api/page-builder/pages?search=your-slug \
  -H "Authorization: Bearer $TOKEN"

# Use a different slug or unpublish the existing page
```

### Error: "Component type not found"
```bash
# List available components
curl http://localhost:3000/api/page-builder/components \
  -H "Authorization: Bearer $TOKEN"
```

### Error: "Invalid schema"
```bash
# Validate component schema
curl -X POST http://localhost:3000/api/page-builder/components/validate-schema \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"schema": YOUR_SCHEMA}'
```

---

## Next Steps

1. **Create your pages** - Use the examples above
2. **Customize components** - Add your own component types
3. **Build templates** - Create reusable page templates
4. **Integrate frontend** - Build the visual editor UI

Happy building! 🚀
