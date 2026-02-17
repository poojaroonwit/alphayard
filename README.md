# UniApps

A modular full-stack platform with separately deployable services for admin management and mobile APIs.

## Architecture

UniApps is composed of **4 independently deployable services**:

| Service | Directory | Port | Description |
|---------|-----------|------|-------------|
| **Admin Frontend** | `admin/` | 3001 | Next.js admin console (AppKit) |
| **Backend Admin** | `backend-admin/` | 3001 | Express API server for admin operations |
| **Backend Mobile** | `backend-mobile/` | 4000 | Express API server for mobile app |
| **Mobile App** | `mobile/` | 8081 | Expo/React Native mobile application |

### Supporting Packages

| Package | Directory | Description |
|---------|-----------|-------------|

| `uniapps-web` | `web/` | Web application (Next.js) |

## Quick Start

### Prerequisites
- Node.js >= 18
- Docker & Docker Compose (for infrastructure services)

### Development

```bash
# Install all dependencies
npm install

# Start all services (Windows)
dev.bat

# Start all services (Unix/macOS)
./dev.sh

# Or start individual services
npm run dev:backend-admin    # Backend Admin API (port 3001)
npm run dev:backend-mobile   # Backend Mobile API (port 4000)
npm run dev:admin            # Admin Frontend (port 3001)
npm run dev:mobile           # Mobile App (port 8081)
npm run dev:web              # Web App (port 3002)
```

### Docker

```bash
# Start all infrastructure + backend services
docker-compose up -d

# View logs
docker-compose logs -f backend-admin backend-mobile
```

## Project Structure

```
uniapps/
├── admin/                  # Admin Frontend (Next.js)
├── backend-admin/          # Backend Admin API (Express + Prisma)
│   ├── src/
│   │   ├── server.ts       # Admin server entry point
│   │   ├── routes/admin/   # Admin-specific routes
│   │   ├── routes/v1/      # V1 admin API routes
│   │   ├── config/         # Database & app config
│   │   ├── middleware/      # Express middleware
│   │   ├── services/       # Business logic services
│   │   └── models/         # Data models
│   └── prisma/             # Prisma schema & migrations
├── backend-mobile/         # Backend Mobile API (Express + Prisma)
│   ├── src/
│   │   ├── server.ts       # Mobile server entry point
│   │   ├── routes/mobile/  # Mobile-specific routes
│   │   ├── routes/v1/      # V1 mobile API routes
│   │   ├── socket/         # WebSocket handlers
│   │   ├── config/         # Database & app config
│   │   ├── middleware/      # Express middleware
│   │   └── services/       # Business logic services
│   └── prisma/             # Prisma schema & migrations
├── mobile/                 # Mobile App (Expo/React Native)
├── web/                    # Web App (Next.js)

├── docker-compose.yml      # Infrastructure services
├── nginx/                  # Production nginx config
├── dev.bat                 # Windows dev launcher
└── dev.sh                  # Unix dev launcher
```

## Environment Variables

Copy `env.example` to `.env` and configure:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
ADMIN_PORT=3001
MOBILE_PORT=4000
```

## 📚 Documentation & Deployment

For a detailed system overview, please see the [Architecture Guide](docs/ARCHITECTURE.md).
For deployment instructions, see the [Deployment Guide](docs/DEPLOYMENT.md).

### Quick Deployment Overview

- **Local Dev**: Run `npm install` then `dev.bat` (Windows) or `./dev.sh` (Unix).
- **Backend**: Use `docker-compose up -d` for a full stack (API + DB + Redis).
- **Frontend**: Deploy `admin/` to Vercel/Netlify.
- **Mobile**: Build via Expo EAS.

> **Note on Naming**:
> *   **UniApps**: The overall platform name.
> *   **AppKit**: The Admin Panel and CMS.
> *   **Boundary**: The Mobile Application.
> *   **Bondarys**: Legacy schema name (Internal DB use only).