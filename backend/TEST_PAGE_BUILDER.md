# Page Builder Backend Testing Guide

This guide helps you test the Page Builder backend to ensure everything is working correctly.

## Quick Test

Run the automated test suite:

```bash
cd backend
node test-page-builder.js
```

This will test all major endpoints and give you a pass/fail report.

## Manual Testing with cURL

### 1. Get Admin Token

```bash
curl -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Save the token from the response.

### 2. Set Token Variable

```bash
# Replace with your actual token
export TOKEN="your-token-here"
```

### 3. Test Component Definitions

```bash
curl http://localhost:3000/api/page-builder/components \
  -H "Authorization: Bearer $TOKEN"
```

Expected: List of 9 default components

### 4. Test Templates

```bash
curl http://localhost:3000/api/page-builder/templates \
  -H "Authorization: Bearer $TOKEN"
```

Expected: List of 4 default templates

### 5. Create a Page

```bash
curl -X POST http://localhost:3000/api/page-builder/pages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Test Page",
    "slug": "my-test-page",
    "description": "Testing the page builder",
    "components": [
      {
        "componentType": "Hero",
        "position": 0,
        "props": {
          "heading": "Welcome",
          "subheading": "This is a test"
        }
      }
    ]
  }'
```

Save the page ID from the response.

### 6. Get the Page

```bash
# Replace PAGE_ID with actual ID
curl http://localhost:3000/api/page-builder/pages/PAGE_ID \
  -H "Authorization: Bearer $TOKEN"
```

### 7. Update the Page

```bash
curl -X PUT http://localhost:3000/api/page-builder/pages/PAGE_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Page Title"
  }'
```

### 8. Get Version History

```bash
curl http://localhost:3000/api/page-builder/pages/PAGE_ID/versions \
  -H "Authorization: Bearer $TOKEN"
```

Expected: At least 2 versions (create + update)

### 9. Publish the Page

```bash
curl -X POST http://localhost:3000/api/page-builder/pages/PAGE_ID/publish \
  -H "Authorization: Bearer $TOKEN"
```

### 10. Get Published Page by Slug

```bash
# No auth required for published pages
curl http://localhost:3000/api/page-builder/pages/slug/my-test-page
```

### 11. Upload an Asset

```bash
curl -X POST http://localhost:3000/api/page-builder/assets/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/your/image.jpg" \
  -F "folder=test"
```

### 12. List Assets

```bash
curl "http://localhost:3000/api/page-builder/assets/list?folder=test" \
  -H "Authorization: Bearer $TOKEN"
```

### 13. Get Publishing Stats

```bash
curl http://localhost:3000/api/page-builder/publishing/stats \
  -H "Authorization: Bearer $TOKEN"
```

### 14. Delete the Page

```bash
curl -X DELETE http://localhost:3000/api/page-builder/pages/PAGE_ID \
  -H "Authorization: Bearer $TOKEN"
```

## Testing with Postman

1. Import the following as a Postman collection
2. Set `{{baseUrl}}` to `http://localhost:3000`
3. Set `{{token}}` to your admin token

### Collection Structure

```
Page Builder API
├── Auth
│   └── Admin Login
├── Components
│   ├── Get All Components
│   ├── Get Component by ID
│   └── Create Component
├── Templates
│   ├── Get All Templates
│   ├── Get Template by ID
│   └── Create Template
├── Pages
│   ├── Get All Pages
│   ├── Create Page
│   ├── Get Page by ID
│   ├── Update Page
│   ├── Delete Page
│   ├── Duplicate Page
│   ├── Publish Page
│   └── Get by Slug (Public)
├── Versions
│   ├── Get Version History
│   ├── Get Version by ID
│   ├── Preview Version
│   ├── Restore Version
│   └── Compare Versions
├── Publishing
│   ├── Get Workflow
│   ├── Request Approval
│   ├── Approve Page
│   ├── Get Pending Approvals
│   └── Get Stats
└── Assets
    ├── Upload Asset
    ├── Upload Multiple
    ├── List Assets
    └── Delete Asset
```

## Expected Results

### ✅ Success Indicators

1. **Health Check**: Returns `{ status: 'ok' }`
2. **Components**: Returns 9 default components
3. **Templates**: Returns 4 default templates
4. **Create Page**: Returns page object with ID
5. **Version History**: Shows versions after each update
6. **Publish**: Changes status to 'published'
7. **Public Access**: Published pages accessible without auth

### ❌ Common Issues

**Issue**: `401 Unauthorized`
- **Solution**: Check your token is valid and included in Authorization header

**Issue**: `404 Not Found`
- **Solution**: Verify the endpoint URL and that the resource exists

**Issue**: `400 Bad Request - URL already exists`
- **Solution**: Use a different slug or unpublish the existing page

**Issue**: `500 Internal Server Error`
- **Solution**: Check server logs for details

## Database Verification

Connect to your database and run:

```sql
-- Check pages
SELECT id, title, slug, status FROM pages;

-- Check components on a page
SELECT pc.*, cd.name as component_name
FROM page_components pc
JOIN component_definitions cd ON pc.component_type = cd.name
WHERE pc.page_id = 'YOUR_PAGE_ID';

-- Check versions
SELECT id, version_number, created_at, created_by
FROM page_versions
WHERE page_id = 'YOUR_PAGE_ID'
ORDER BY version_number DESC;

-- Check publishing stats
SELECT status, COUNT(*) as count
FROM pages
GROUP BY status;
```

## Performance Testing

Test with multiple concurrent requests:

```bash
# Create 10 pages concurrently
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/page-builder/pages \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"title\":\"Test Page $i\",\"slug\":\"test-page-$i\"}" &
done
wait
```

## Troubleshooting

### Server Not Responding

```bash
# Check if server is running
curl http://localhost:3000/health

# Check server logs
cd backend
npm run dev
```

### Database Connection Issues

```bash
# Test database connection
psql $DATABASE_URL -c "SELECT COUNT(*) FROM pages;"
```

### Migration Not Run

```bash
# Run migration
cd backend
node setup/08-run-page-builder-migration.js
```

## Next Steps

Once all tests pass:

1. ✅ Backend is working correctly
2. ✅ Ready for frontend integration
3. ✅ Can start building the admin UI

## Support

For issues:
- Check `IMPLEMENTATION_STATUS.md` for details
- Review `QUICK_START.md` for setup
- Check server logs for errors
