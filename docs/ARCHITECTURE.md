# UniApps System Architecture

UniApps is a modern, full-stack platform designed with a modular monorepo architecture. It separates concerns between the administrative control plane (**AppKit**) and the consumer-facing mobile experience (**Boundary**), while sharing core logic and infrastructure.

## 🏗️ High-Level Architecture

```mermaid
graph TD
    subgraph "Clients"
        AppKit["AppKit Admin Console\n(Next.js)"]
        Boundary["Boundary Mobile App\n(React Native / Expo)"]
    end

    subgraph "API Layer"
        AdminAPI["Backend Admin API\n(Express.js)"]
        MobileAPI["Backend Mobile API\n(Express.js)"]
    end

    subgraph "Shared Infrastructure"
        DB[("PostgreSQL\nSchema: bondarys")]
        Redis[("Redis Cache")]
        MinIO[("Object Storage")]
    end

    AppKit -->|HTTP/REST| AdminAPI
    Boundary -->|HTTP/REST + WebSocket| MobileAPI
    
    AdminAPI --> DB
    AdminAPI --> Redis
    MobileAPI --> DB
    MobileAPI --> Redis
    
    AdminAPI -.->|Shared Logic| SharedLib
    MobileAPI -.->|Shared Logic| SharedLib
    
    subgraph "Shared Code"
        SharedLib[@uniapps/shared\n(Types, Utils)]
    end
```

## 🧩 Component Breakdown

### 1. Monorepo Structure (npm Workspaces)
The project is organized as a monorepo to ensure code consistency and easy dependency management.
*   **Root**: Configuration for ESLint, Prettier, Docker Compose.
*   **packages/**: Shared libraries (e.g., `@uniapps/shared`).
*   **apps/** (Implicit): `admin`, `boundary-app`, `backend-admin`, `backend-mobile`.

### 2. Frontend Services
*   **AppKit Admin (`admin/`)**:
    *   **Framework**: Next.js (React).
    *   **Purpose**: CMS, User Management, Analytics, System Configuration.
    *   **Key Tech**: TailwindCSS, React Query, shadcn/ui.
*   **Boundary Mobile (`boundary-app/`)**:
    *   **Framework**: Expo / React Native.
    *   **Purpose**: End-user social and utility application.
    *   **Key Tech**: React Native Maps, Reanimated, Expo Router.

### 3. Backend Services
*   **Backend Admin (`backend-admin/`)**:
    *   **Framework**: Express.js with TypeScript.
    *   **key Responsibilities**: User administration, tenancy management, comprehensive data access.
    *   **Authentication**: JWT-based admin sessions.
*   **Backend Mobile (`backend-mobile/`)**:
    *   **Framework**: Express.js with TypeScript.
    *   **Key Responsibilities**: Real-time chat (Socket.io), geolocation services, feed generation.
    *   **Optimization**: Optimized for high-concurrency mobile requests.

### 4. Data Layer
*   **Database**: PostgreSQL 15+.
    *   **Schema**: The application strictly uses the `bondarys` schema for isolation.
    *   **ORM**: Prisma is used for type-safe database access in both backends.
*   **Caching**: Redis is used for:
    *   Session storage.
    *   API response caching.
    *   Socket.io adapter (pub/sub).
*   **Storage**: MinIO (S3 compatible) for file uploads (avatars, media).

## 🔄 Key Data Flows

### Authentication
*   **Mobile**: Users authenticate via Phone/Email or Social Auth. Tokens are issued by `backend-mobile`.
*   **Admin**: Admins authenticate via Email/Password. Tokens are issued by `backend-admin`.

### Real-Time Communication
*   **Chat**: `backend-mobile` hosts a Socket.io server.
*   **Notifications**: Push notifications are handled via Expo Push API, triggered by `backend-mobile`.

## 🛠️ Technology Stack Summary

| Layer | Technology |
|-------|------------|
| **Languages** | TypeScript, JavaScript |
| **Runtime** | Node.js v18+ |
| **Frontend** | React, Next.js, React Native, Expo |
| **Backend** | Express.js, Socket.io |
| **Database** | PostgreSQL (Prisma ORM) |
| **Cache** | Redis |
| **DevOps** | Docker, Nginx, CI/CD |
