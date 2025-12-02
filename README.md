# Bondarys - Family Management Platform

A comprehensive family management platform that combines communication, safety, finance, and productivity features in one unified application.

## 🚀 Recent Updates

### Main Menu Redesign (Latest)
- **Removed Add Button**: Eliminated the universal add button from the bottom navigation
- **Applications Popup**: Replaced the Applications screen with an interactive popup menu
- **Arrow-Up Icon**: Applications tab now uses an arrow-up icon that triggers a popup
- **Enhanced UX**: Smooth animations and gesture support for better user experience
- **App Grid**: All applications are displayed in a beautiful grid layout within the popup

### Navigation Structure
```
[📅] [🏠] [⬆️] [👤]
Calendar | Home | Apps | Profile
```

The Applications tab (⬆️) now opens a popup menu containing:
- **Communication**: Gallery, Chat, Social
- **Productivity**: Storage, Notes, Calendar, Tasks, Goals
- **Safety**: Location, Health
- **Finance**: Budget, Expenses, Savings, Investments, Bills
- **Settings**: Family Settings

## 🏗️ Project Structure

```
bondarys/
├── mobile/                 # React Native mobile app
│   ├── src/
│   │   ├── navigation/     # Navigation configuration
│   │   ├── screens/        # App screens
│   │   ├── components/     # Reusable components
│   │   └── services/       # API and business logic
├── backend/                # Node.js backend server
├── marketing-website/      # Marketing website
├── admin/                  # Admin dashboard (Next.js)
## Quick Start

### Automated Setup (Recommended)

**Windows (PowerShell):**
```powershell
.\scripts\setup-docker.ps1
```

**Linux/Mac (Bash):**
```bash
chmod +x scripts/setup-docker.sh
./scripts/setup-docker.sh
```

This script will:
- Start all Docker Compose services
- Wait for database initialization
- Configure required schemas (auth, realtime)
- Verify all services are running

See [scripts/README-SETUP.md](scripts/README-SETUP.md) for details.

### Manual Setup

```bash
# Start dev stack (Supabase+Redis, backend, admin, mobile)
npm run dev:all

# Stop Docker services (Supabase, Redis)
npm run dev:stop

# Apply Supabase schema/seed
npm run db:setup

# Minimal deploy of Supabase+Redis
npm run deploy:min
```
 
### Supabase setup (app_settings table & seeds)

1) Create or update `supabase/seed.sql` with the app settings table, RLS, policies, and defaults. Use this content:

```sql
-- app_settings table (key/value)
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now(),
  updated_by text
);

-- Enable RLS
alter table public.app_settings enable row level security;

-- Policies
create policy if not exists app_settings_read on public.app_settings
for select to authenticated using (true);

create policy if not exists app_settings_write on public.app_settings
for all to authenticated
using ((auth.jwt() ->> 'role') = 'admin')
with check ((auth.jwt() ->> 'role') = 'admin');

-- Seed defaults
insert into public.app_settings (key, value)
select 'branding', jsonb_build_object('adminAppName','Bondarys Admin','mobileAppName','Bondarys Mobile')
where not exists (select 1 from public.app_settings where key = 'branding');

insert into public.app_settings (key, value)
select 'integrations', jsonb_build_object(
  'mobileGA', jsonb_build_object('measurementId',''),
  'smtpMobile', jsonb_build_object('host','', 'port',587, 'user','', 'pass','', 'from',''),
  'smtpAdmin', jsonb_build_object('host','', 'port',587, 'user','', 'pass','', 'from',''),
  'ssoMobile', jsonb_build_object('provider','none','clientId','', 'clientSecret','', 'issuerUrl',''),
  'ssoAdmin', jsonb_build_object('provider','none','clientId','', 'clientSecret','', 'issuerUrl','')
)
where not exists (select 1 from public.app_settings where key = 'integrations');
```

2) Supabase config already points seeding to `./supabase/seed.sql`. Apply seeds:

```bash
supabase start
supabase db reset   # WARNING: resets local DB and applies seed
# or
supabase db seed
```

3) Ensure your JWT includes `role=admin` to write integrations via API:

```http
PUT /api/settings/integrations
Authorization: Bearer <admin-jwt>
Content-Type: application/json
```
└── docs/                   # Documentation
```

## 🎨 Design System

### Color Palette
- **Primary**: Red (#D32F2F) - Trust and safety
- **Secondary**: Gold (#FFD700) - Premium features
- **Background**: White (#FFFFFF) - Clean and modern
- **Text**: Dark Gray (#333333) - Readability

### Typography
- **Primary Font**: SF Pro Display (iOS) / Roboto (Android)
- **Secondary Font**: SF Pro Text (iOS) / Roboto (Android)

## 🚀 Getting Started

### Prerequisites
- Node.js >= 16
- Expo CLI
- React Native development environment

### Quick Start (one line)

- Windows (PowerShell or CMD):
```
scripts\run-localhost.bat --start
```

- macOS/Linux:
```
bash scripts/run-localhost.sh --start
```

This will start Supabase, Redis, and MongoDB via Docker, then boot the backend API, admin console, mobile Metro bundler, and marketing website. After startup, visit:
- Backend API health: http://localhost:3000/health
- Admin Console: http://localhost:3001
- Marketing Website: http://localhost:3000
- Supabase Studio: http://localhost:54321

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/bondarys.git
   cd bondarys
   ```

2. **Install mobile app dependencies**
   ```bash
   cd mobile
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd ../backend
   npm install
   ```

4. **Start the development server**
   ```bash
   # Start backend
   cd backend
   npm run dev
   
   # Start mobile app (in new terminal)
   cd mobile
   npm start
   ```

## 📱 Mobile App Features

### Core Features
- **Family Management**: Create and manage family groups
- **Communication**: Chat, video calls, and voice messages
- **Safety**: Location tracking and emergency alerts
- **Finance**: Budget tracking and expense management
- **Productivity**: Calendar, tasks, and notes
- **Storage**: File management and sharing

### Navigation
- **Bottom Tab Navigation**: Calendar, Home, Applications (popup), Profile
- **Applications Popup**: Access all apps from a single popup menu
- **Smooth Animations**: Enhanced user experience with animations

## 🔧 Development

### Mobile App Structure
```
mobile/src/
├── navigation/
│   ├── MainTabNavigator.tsx    # Bottom tab navigation
│   └── RootNavigator.tsx       # Stack navigation
├── components/
│   ├── popup/
│   │   └── ApplicationsPopup.tsx  # Applications popup menu
│   └── common/                 # Reusable components
├── screens/                    # App screens
├── services/                   # API services
└── theme/                     # Design system
```

### Key Components

#### ApplicationsPopup
- **Location**: `mobile/src/components/popup/ApplicationsPopup.tsx`
- **Purpose**: Displays all available applications in a popup menu
- **Features**: Grid layout, gradient icons, badges, smooth animations
- **Trigger**: Arrow-up button in bottom navigation

#### MainTabNavigator
- **Location**: `mobile/src/navigation/MainTabNavigator.tsx`
- **Purpose**: Bottom tab navigation with applications popup integration
- **Features**: Animated arrow-up button, popup trigger, smooth transitions

## 🎯 Roadmap

### Phase 1: Core Features ✅
- [x] Project structure and documentation
- [x] Mobile app foundation
- [x] Navigation system
- [x] Applications popup menu
- [x] Basic screens and components

### Phase 2: Enhanced Features 🚧
- [ ] Complete screen implementations
- [ ] Real-time features (Socket.io)
- [ ] Push notifications
- [ ] File upload system
- [ ] Advanced family management

### Phase 3: Advanced Features 📋
- [ ] AI-powered features
- [ ] Advanced analytics
- [ ] Premium features
- [ ] Third-party integrations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Email: support@bondarys.com
- Documentation: [docs/](docs/)
- Issues: [GitHub Issues](https://github.com/your-username/bondarys/issues)

---

**Bondarys** - Connecting families, building communities, securing futures. 