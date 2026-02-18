# Bondarys CMS Admin Console - Next.js

A professional Next.js web application for managing Bondarys Circle content.

## Features

- 🎯 **Modern React Architecture** - Built with Next.js 14 and TypeScript
- 🎨 **Professional UI** - Tailwind CSS with custom components
- 📱 **Responsive Design** - Works on all devices
- 🔄 **Real-time Updates** - Live content management
- 📊 **Analytics Dashboard** - Content insights and metrics
- ✏️ **Content Management** - Create, edit, delete Circle content
- 🔍 **Search & Filter** - Find content quickly
- 🎭 **Content Types** - Circle news, events, memories, alerts, recipes, tips

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Access Admin Console**
   Open http://localhost:3001 in your browser

## Environment Variables

Create `.env.local` file:
```
NEXT_PUBLIC_API_URL=http://localhost:3000/api/cms
```

## Scripts

- `npm run dev` - Start development server (port 3001)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Architecture

### Frontend (Next.js)
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with custom components
- **State**: React hooks and context
- **HTTP**: Axios for API communication
- **Icons**: Heroicons for consistent iconography

### Backend Integration
- **API**: Communicates with Express.js backend
- **CORS**: Configured for cross-origin requests
- **Proxy**: Next.js rewrites for API routing

## Components

- **Header** - Navigation and branding
- **ContentManager** - Main content list and management
- **ContentCard** - Individual content item display
- **AnalyticsDashboard** - Content metrics and insights
- **CreateContentForm** - Content creation interface
- **LoadingSpinner** - Loading states

## Content Types

- 📰 **Circle News** - Updates and announcements
- 🎉 **Circle Events** - Special occasions and gatherings
- 📸 **Circle Memories** - Photos and stories
- 🚨 **Safety Alerts** - Important safety information
- 👨‍🍳 **Circle Recipes** - Cooking and meal planning
- 💡 **Circle Tips** - Helpful advice and tips

## Development

The admin console is designed to work seamlessly with the Bondarys backend API. Make sure the backend server is running on port 3000 before starting the Next.js development server.

