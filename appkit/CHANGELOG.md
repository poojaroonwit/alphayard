# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Global Search**: Enhanced search functionality querying Applications, Circles, and Users.
- **User Avatar**: New API and UI for uploading and managing user profile photos.
- **Organization Management**: Centralized system settings for organization-wide configuration.
- **Circle Pincode**: Support for dynamic circle code and pincode generation.
- **User Points**: Implemented points tracking system across schema and UI.
- **Platform Docs**: Integrated "Full Docs" link to Dev Hub in topbar.

### Fixed
- **SSO Visibility**: Fixed issue where SSO providers were hidden by merging configuration sources.
- **Dark Mode**: Resolved styling inconsistencies for borders, shadows, and navigation elements.
- **Search UI**: Added `⌘K` keyboard shortcut hint and refined response animations.
- **Avatar Popover**: Removed redundant "Your Profile" link for cleaner navigation.

### Changed
- **User Drawer**: Redesigned "Edit User" interface with a tabbed, two-column layout.
- **Admin Navigation**: Optimized sidebar with new iconography for "System" and "Organization".
- **API Paths**: Updated search results to use correct deep-linking for users.

## [1.0.0] - 2026-02-28

### Added
- Initial release of AppKit Console.
- Core Application and Circle management.
- Multi-tenant authentication and identity services.
- Theme system (Light/Dark/System).
- Responsive Admin layout.
