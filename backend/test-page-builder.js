#!/usr/bin/env node

/**
 * Page Builder API Test Script
 * Tests all major endpoints to verify the backend is working correctly
 */

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/page-builder`;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

let token = '';
let testPageId = '';
let testVersionId = '';

// Helper functions
const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const logSuccess = (message) => log(`✓ ${message}`, 'green');
const logError = (message) => log(`✗ ${message}`, 'red');
const logInfo = (message) => log(`ℹ ${message}`, 'cyan');
const logSection = (message) => log(`\n${'='.repeat(60)}\n${message}\n${'='.repeat(60)}`, 'blue');

// Test functions
async function getAdminToken() {
  logSection('Step 1: Getting Admin Token');
  try {
    const response = await axios.post(`${BASE_URL}/api/admin/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    token = response.data.token;
    logSuccess('Admin token obtained');
    return true;
  } catch (error) {
    logError(`Failed to get admin token: ${error.message}`);
    return false;
  }
}

async function testHealthCheck() {
  logSection('Step 2: Testing Health Check');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    logSuccess('Health check passed');
    logInfo(`Status: ${response.data.status}`);
    return true;
  } catch (error) {
    logError(`Health check failed: ${error.message}`);
    return false;
  }
}

async function testGetComponents() {
  logSection('Step 3: Testing Component Definitions');
  try {
    const response = await axios.get(`${API_BASE}/components`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    logSuccess(`Found ${response.data.components.length} component definitions`);
    response.data.components.slice(0, 3).forEach(comp => {
      logInfo(`  - ${comp.name} (${comp.category})`);
    });
    return true;
  } catch (error) {
    logError(`Failed to get components: ${error.message}`);
    return false;
  }
}

async function testGetTemplates() {
  logSection('Step 4: Testing Templates');
  try {
    const response = await axios.get(`${API_BASE}/templates`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    logSuccess(`Found ${response.data.templates.length} templates`);
    response.data.templates.forEach(template => {
      logInfo(`  - ${template.name} (${template.category})`);
    });
    return true;
  } catch (error) {
    logError(`Failed to get templates: ${error.message}`);
    return false;
  }
}

async function testCreatePage() {
  logSection('Step 5: Testing Page Creation');
  try {
    const response = await axios.post(`${API_BASE}/pages`, {
      title: 'Test Page',
      slug: 'test-page-' + Date.now(),
      description: 'This is a test page created by the test script',
      components: [
        {
          componentType: 'Hero',
          position: 0,
          props: {
            heading: 'Welcome to Test Page',
            subheading: 'This page was created automatically',
            ctaText: 'Get Started',
            ctaUrl: '#'
          }
        },
        {
          componentType: 'Text',
          position: 1,
          props: {
            text: '<p>This is a test paragraph.</p>',
            align: 'left'
          }
        }
      ]
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    testPageId = response.data.page.id;
    logSuccess('Page created successfully');
    logInfo(`  Page ID: ${testPageId}`);
    logInfo(`  Title: ${response.data.page.title}`);
    logInfo(`  Slug: ${response.data.page.slug}`);
    return true;
  } catch (error) {
    logError(`Failed to create page: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function testGetPage() {
  logSection('Step 6: Testing Get Page');
  try {
    const response = await axios.get(`${API_BASE}/pages/${testPageId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    logSuccess('Page retrieved successfully');
    logInfo(`  Components: ${response.data.page.page_components.length}`);
    return true;
  } catch (error) {
    logError(`Failed to get page: ${error.message}`);
    return false;
  }
}

async function testUpdatePage() {
  logSection('Step 7: Testing Page Update');
  try {
    const response = await axios.put(`${API_BASE}/pages/${testPageId}`, {
      title: 'Updated Test Page',
      description: 'This page has been updated'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    logSuccess('Page updated successfully');
    logInfo(`  New title: ${response.data.page.title}`);
    return true;
  } catch (error) {
    logError(`Failed to update page: ${error.message}`);
    return false;
  }
}

async function testVersionHistory() {
  logSection('Step 8: Testing Version History');
  try {
    const response = await axios.get(`${API_BASE}/pages/${testPageId}/versions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    logSuccess(`Found ${response.data.versions.length} version(s)`);
    if (response.data.versions.length > 0) {
      testVersionId = response.data.versions[0].id;
      logInfo(`  Latest version: ${response.data.versions[0].version_number}`);
    }
    return true;
  } catch (error) {
    logError(`Failed to get version history: ${error.message}`);
    return false;
  }
}

async function testPublishPage() {
  logSection('Step 9: Testing Page Publishing');
  try {
    const response = await axios.post(`${API_BASE}/pages/${testPageId}/publish`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    logSuccess('Page published successfully');
    logInfo(`  Status: ${response.data.page.status}`);
    return true;
  } catch (error) {
    logError(`Failed to publish page: ${error.message}`);
    return false;
  }
}

async function testGetPublishedPage() {
  logSection('Step 10: Testing Get Published Page by Slug');
  try {
    // First get the page to find its slug
    const pageResponse = await axios.get(`${API_BASE}/pages/${testPageId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const slug = pageResponse.data.page.slug;
    
    // Now get it by slug (public endpoint)
    const response = await axios.get(`${API_BASE}/pages/slug/${slug}`);
    logSuccess('Published page retrieved by slug');
    logInfo(`  Slug: ${slug}`);
    return true;
  } catch (error) {
    logError(`Failed to get published page: ${error.message}`);
    return false;
  }
}

async function testDuplicatePage() {
  logSection('Step 11: Testing Page Duplication');
  try {
    const response = await axios.post(`${API_BASE}/pages/${testPageId}/duplicate`, {
      newSlug: 'test-page-duplicate-' + Date.now()
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    logSuccess('Page duplicated successfully');
    logInfo(`  New page ID: ${response.data.page.id}`);
    logInfo(`  New slug: ${response.data.page.slug}`);
    
    // Clean up duplicate
    await axios.delete(`${API_BASE}/pages/${response.data.page.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    logInfo('  Duplicate cleaned up');
    return true;
  } catch (error) {
    logError(`Failed to duplicate page: ${error.message}`);
    return false;
  }
}

async function testPublishingStats() {
  logSection('Step 12: Testing Publishing Statistics');
  try {
    const response = await axios.get(`${API_BASE}/publishing/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    logSuccess('Publishing statistics retrieved');
    logInfo(`  Total pages: ${response.data.stats.total}`);
    logInfo(`  Published: ${response.data.stats.published}`);
    logInfo(`  Draft: ${response.data.stats.draft}`);
    return true;
  } catch (error) {
    logError(`Failed to get publishing stats: ${error.message}`);
    return false;
  }
}

async function testCleanup() {
  logSection('Step 13: Cleanup - Deleting Test Page');
  try {
    await axios.delete(`${API_BASE}/pages/${testPageId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    logSuccess('Test page deleted successfully');
    return true;
  } catch (error) {
    logError(`Failed to delete test page: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  log('\n🚀 Page Builder API Test Suite\n', 'yellow');
  log(`Testing API at: ${BASE_URL}\n`, 'cyan');

  const tests = [
    getAdminToken,
    testHealthCheck,
    testGetComponents,
    testGetTemplates,
    testCreatePage,
    testGetPage,
    testUpdatePage,
    testVersionHistory,
    testPublishPage,
    testGetPublishedPage,
    testDuplicatePage,
    testPublishingStats,
    testCleanup
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      logError(`Unexpected error in ${test.name}: ${error.message}`);
      failed++;
    }
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Summary
  logSection('Test Summary');
  log(`Total Tests: ${tests.length}`, 'cyan');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, 'red');
  
  if (failed === 0) {
    log('\n🎉 All tests passed! Your Page Builder backend is working correctly!\n', 'green');
  } else {
    log('\n⚠️  Some tests failed. Please check the errors above.\n', 'yellow');
  }

  process.exit(failed > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(error => {
  logError(`Fatal error: ${error.message}`);
  process.exit(1);
});
