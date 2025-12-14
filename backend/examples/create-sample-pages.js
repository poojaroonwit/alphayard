#!/usr/bin/env node

/**
 * Sample Page Creation Script
 * Creates example pages using the Page Builder API
 */

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/page-builder`;

let token = '';

// Helper to log with colors
const log = (msg, color = '\x1b[0m') => console.log(`${color}${msg}\x1b[0m`);
const success = (msg) => log(`✓ ${msg}`, '\x1b[32m');
const info = (msg) => log(`ℹ ${msg}`, '\x1b[36m');
const error = (msg) => log(`✗ ${msg}`, '\x1b[31m');

// Get admin token
async function getToken() {
  try {
    const response = await axios.post(`${BASE_URL}/api/admin/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    token = response.data.token;
    success('Authenticated successfully');
    return token;
  } catch (err) {
    error('Failed to authenticate');
    throw err;
  }
}

// Create a landing page
async function createLandingPage() {
  info('\nCreating Landing Page...');
  
  try {
    const response = await axios.post(`${API_BASE}/pages`, {
      title: 'Welcome to Bondarys',
      slug: 'welcome',
      description: 'Main landing page for Bondarys family safety platform',
      seoConfig: {
        title: 'Bondarys - Family Safety Network',
        description: 'Keep your family safe and connected with Bondarys',
        keywords: ['family safety', 'location tracking', 'family network']
      },
      components: [
        {
          componentType: 'Hero',
          position: 0,
          props: {
            heading: 'Keep Your Family Safe & Connected',
            subheading: 'The complete family safety network that brings peace of mind',
            ctaText: 'Get Started Free',
            ctaUrl: '/signup',
            backgroundImage: '/images/hero-family.jpg'
          },
          styles: {
            backgroundColor: '#4ECDC4',
            textColor: '#ffffff',
            padding: { top: '80px', bottom: '80px' }
          }
        },
        {
          componentType: 'FeatureGrid',
          position: 1,
          props: {
            title: 'Everything Your Family Needs',
            features: [
              {
                icon: '📍',
                title: 'Real-Time Location',
                description: 'Know where your family members are at all times'
              },
              {
                icon: '🚨',
                title: 'Safety Alerts',
                description: 'Instant notifications for safety incidents'
              },
              {
                icon: '💬',
                title: 'Family Chat',
                description: 'Stay connected with secure family messaging'
              },
              {
                icon: '📅',
                title: 'Shared Calendar',
                description: 'Coordinate schedules and events together'
              },
              {
                icon: '🏠',
                title: 'Home Management',
                description: 'Manage your household in one place'
              },
              {
                icon: '🔒',
                title: 'Privacy First',
                description: 'Your family data is encrypted and secure'
              }
            ]
          },
          styles: {
            backgroundColor: '#f8f9fa',
            padding: { top: '60px', bottom: '60px' }
          }
        },
        {
          componentType: 'Text',
          position: 2,
          props: {
            text: '<h2>Trusted by Thousands of Families</h2><p>Join the growing community of families who trust Bondarys to keep them safe and connected.</p>',
            align: 'center'
          },
          styles: {
            padding: { top: '40px', bottom: '40px' }
          }
        },
        {
          componentType: 'Button',
          position: 3,
          props: {
            text: 'Start Your Free Trial',
            url: '/signup',
            variant: 'primary',
            size: 'lg'
          },
          styles: {
            textAlign: 'center',
            padding: { bottom: '60px' }
          }
        }
      ]
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    success(`Landing page created: ${response.data.page.id}`);
    info(`  URL: /welcome`);
    return response.data.page;
  } catch (err) {
    error(`Failed to create landing page: ${err.response?.data?.error || err.message}`);
    throw err;
  }
}

// Create an about page
async function createAboutPage() {
  info('\nCreating About Page...');
  
  try {
    const response = await axios.post(`${API_BASE}/pages`, {
      title: 'About Bondarys',
      slug: 'about',
      description: 'Learn about our mission to keep families safe',
      seoConfig: {
        title: 'About Bondarys - Our Mission',
        description: 'Learn about Bondarys and our mission to keep families safe and connected'
      },
      components: [
        {
          componentType: 'Container',
          position: 0,
          props: {
            maxWidth: 'md',
            padding: 'lg'
          },
          children: [
            {
              componentType: 'Heading',
              position: 0,
              props: {
                text: 'About Bondarys',
                level: 'h1',
                align: 'center'
              }
            },
            {
              componentType: 'Text',
              position: 1,
              props: {
                text: `
                  <p>Bondarys was founded with a simple mission: to give families peace of mind through technology.</p>
                  <p>We believe that staying connected with your loved ones shouldn't be complicated. That's why we've built a platform that combines location tracking, safety alerts, and family communication in one easy-to-use app.</p>
                  <h3>Our Values</h3>
                  <ul>
                    <li><strong>Safety First:</strong> Your family's safety is our top priority</li>
                    <li><strong>Privacy Matters:</strong> Your data is encrypted and never shared</li>
                    <li><strong>Easy to Use:</strong> Technology should be simple and accessible</li>
                    <li><strong>Family Focused:</strong> Built by families, for families</li>
                  </ul>
                  <h3>Our Team</h3>
                  <p>We're a dedicated team of parents, engineers, and safety experts who understand the challenges families face in today's world.</p>
                `,
                align: 'left'
              }
            }
          ]
        }
      ]
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    success(`About page created: ${response.data.page.id}`);
    info(`  URL: /about`);
    return response.data.page;
  } catch (err) {
    error(`Failed to create about page: ${err.response?.data?.error || err.message}`);
    throw err;
  }
}

// Create a features page
async function createFeaturesPage() {
  info('\nCreating Features Page...');
  
  try {
    const response = await axios.post(`${API_BASE}/pages`, {
      title: 'Features',
      slug: 'features',
      description: 'Explore all the features that make Bondarys the best family safety platform',
      components: [
        {
          componentType: 'Hero',
          position: 0,
          props: {
            heading: 'Powerful Features for Modern Families',
            subheading: 'Everything you need to keep your family safe and connected'
          },
          styles: {
            backgroundColor: '#667eea',
            textColor: '#ffffff'
          }
        },
        {
          componentType: 'Grid',
          position: 1,
          props: {
            columns: 2,
            gap: 'lg'
          },
          children: [
            {
              componentType: 'Section',
              position: 0,
              props: {
                backgroundColor: '#ffffff',
                paddingY: 'md'
              },
              children: [
                {
                  componentType: 'Heading',
                  position: 0,
                  props: {
                    text: '📍 Real-Time Location Tracking',
                    level: 'h3'
                  }
                },
                {
                  componentType: 'Text',
                  position: 1,
                  props: {
                    text: '<p>See where your family members are in real-time on an interactive map. Set up safe zones and get notified when family members arrive or leave.</p>'
                  }
                }
              ]
            },
            {
              componentType: 'Section',
              position: 1,
              props: {
                backgroundColor: '#ffffff',
                paddingY: 'md'
              },
              children: [
                {
                  componentType: 'Heading',
                  position: 0,
                  props: {
                    text: '🚨 Safety Alerts',
                    level: 'h3'
                  }
                },
                {
                  componentType: 'Text',
                  position: 1,
                  props: {
                    text: '<p>Instant notifications for safety incidents. One-tap SOS button for emergencies. Automatic alerts for unusual activity.</p>'
                  }
                }
              ]
            },
            {
              componentType: 'Section',
              position: 2,
              props: {
                backgroundColor: '#ffffff',
                paddingY: 'md'
              },
              children: [
                {
                  componentType: 'Heading',
                  position: 0,
                  props: {
                    text: '💬 Family Chat',
                    level: 'h3'
                  }
                },
                {
                  componentType: 'Text',
                  position: 1,
                  props: {
                    text: '<p>Secure messaging for your family. Share photos, videos, and locations. Create group chats for different family circles.</p>'
                  }
                }
              ]
            },
            {
              componentType: 'Section',
              position: 3,
              props: {
                backgroundColor: '#ffffff',
                paddingY: 'md'
              },
              children: [
                {
                  componentType: 'Heading',
                  position: 0,
                  props: {
                    text: '📅 Shared Calendar',
                    level: 'h3'
                  }
                },
                {
                  componentType: 'Text',
                  position: 1,
                  props: {
                    text: '<p>Coordinate schedules and events. Set reminders for important dates. See everyone\'s availability at a glance.</p>'
                  }
                }
              ]
            }
          ]
        }
      ]
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    success(`Features page created: ${response.data.page.id}`);
    info(`  URL: /features`);
    return response.data.page;
  } catch (err) {
    error(`Failed to create features page: ${err.response?.data?.error || err.message}`);
    throw err;
  }
}

// Create a contact page
async function createContactPage() {
  info('\nCreating Contact Page...');
  
  try {
    const response = await axios.post(`${API_BASE}/pages`, {
      title: 'Contact Us',
      slug: 'contact',
      description: 'Get in touch with the Bondarys team',
      components: [
        {
          componentType: 'Container',
          position: 0,
          props: {
            maxWidth: 'md',
            padding: 'lg'
          },
          children: [
            {
              componentType: 'Heading',
              position: 0,
              props: {
                text: 'Contact Us',
                level: 'h1',
                align: 'center'
              }
            },
            {
              componentType: 'Text',
              position: 1,
              props: {
                text: '<p>We\'d love to hear from you! Whether you have questions, feedback, or need support, our team is here to help.</p>',
                align: 'center'
              }
            },
            {
              componentType: 'Grid',
              position: 2,
              props: {
                columns: 2,
                gap: 'md'
              },
              children: [
                {
                  componentType: 'Text',
                  position: 0,
                  props: {
                    text: '<h3>📧 Email</h3><p>support@bondarys.com</p>'
                  }
                },
                {
                  componentType: 'Text',
                  position: 1,
                  props: {
                    text: '<h3>📱 Phone</h3><p>1-800-BONDARYS</p>'
                  }
                },
                {
                  componentType: 'Text',
                  position: 2,
                  props: {
                    text: '<h3>💬 Live Chat</h3><p>Available 24/7 in the app</p>'
                  }
                },
                {
                  componentType: 'Text',
                  position: 3,
                  props: {
                    text: '<h3>🏢 Office</h3><p>123 Safety Street<br>San Francisco, CA 94102</p>'
                  }
                }
              ]
            }
          ]
        }
      ]
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    success(`Contact page created: ${response.data.page.id}`);
    info(`  URL: /contact`);
    return response.data.page;
  } catch (err) {
    error(`Failed to create contact page: ${err.response?.data?.error || err.message}`);
    throw err;
  }
}

// Publish a page
async function publishPage(pageId, title) {
  try {
    await axios.post(`${API_BASE}/pages/${pageId}/publish`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    success(`Published: ${title}`);
  } catch (err) {
    error(`Failed to publish ${title}: ${err.response?.data?.error || err.message}`);
  }
}

// Main function
async function main() {
  log('\n🚀 Creating Sample Pages for Bondarys\n', '\x1b[33m');
  
  try {
    // Authenticate
    await getToken();
    
    // Create pages
    const landingPage = await createLandingPage();
    const aboutPage = await createAboutPage();
    const featuresPage = await createFeaturesPage();
    const contactPage = await createContactPage();
    
    // Publish all pages
    info('\nPublishing pages...');
    await publishPage(landingPage.id, landingPage.title);
    await publishPage(aboutPage.id, aboutPage.title);
    await publishPage(featuresPage.id, featuresPage.title);
    await publishPage(contactPage.id, contactPage.title);
    
    // Summary
    log('\n' + '='.repeat(60), '\x1b[34m');
    success('All sample pages created and published!');
    log('='.repeat(60) + '\n', '\x1b[34m');
    
    info('Pages created:');
    info(`  • ${BASE_URL}/api/page-builder/pages/slug/welcome`);
    info(`  • ${BASE_URL}/api/page-builder/pages/slug/about`);
    info(`  • ${BASE_URL}/api/page-builder/pages/slug/features`);
    info(`  • ${BASE_URL}/api/page-builder/pages/slug/contact`);
    
    log('\n✨ Your pages are ready to view!\n', '\x1b[32m');
    
  } catch (err) {
    error('\nFailed to create sample pages');
    console.error(err);
    process.exit(1);
  }
}

// Run
main();
