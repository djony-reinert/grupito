# Grupito Mobile App - Agent Context

## Project Overview
Grupito is a mobile application for Brazilian users to organize groups and events. The app enables group creation, event management, RSVP systems, and member management with a Portuguese Brazilian interface.

## Current Feature Status
**Active Branch**: `001-build-a-mobile`
**Phase**: Implementation Planning Complete
**Next**: Task generation and execution

## Technical Stack

### Mobile Application
- **Framework**: React Native with Expo SDK 50+
- **Language**: TypeScript
- **Navigation**: React Navigation 6 (bottom tabs + stack)
- **State Management**: React Query + Zustand
- **Authentication**: @clerk/clerk-expo with expo-secure-store
- **Styling**: NativeWind (Tailwind for React Native)

### Backend & Infrastructure
- **Database**: Supabase PostgreSQL with Row Level Security
- **Real-time**: Supabase Realtime subscriptions
- **Storage**: Supabase Storage for images
- **API**: Supabase Auto API + Edge Functions
- **Push Notifications**: Expo Notifications

### Testing & Development
- **Testing**: Jest + React Native Testing Library
- **E2E Testing**: Detox
- **Build Pipeline**: EAS Build
- **Development**: Expo development build with hot reload

## Project Structure
```
mobile/
├── src/
│   ├── components/        # Reusable UI components
│   ├── screens/          # Screen components
│   ├── services/         # API and business logic
│   ├── hooks/            # Custom React hooks
│   ├── types/            # TypeScript definitions
│   ├── utils/            # Helper functions
│   └── navigation/       # Navigation configuration
├── assets/               # Images, fonts, etc.
└── __tests__/           # Test files

api/
├── supabase/
│   ├── migrations/       # Database schema
│   ├── functions/        # Edge Functions
│   └── seed.sql         # Test data
└── tests/               # API tests
```

## Key Features Implemented

### Authentication & User Management
- Clerk authentication with social logins
- User profile management
- Privacy settings and preferences
- LGPD-compliant data handling

### Group Management
- Create public/private groups with categories
- Member invitation and role management (Creator/Admin/Member)
- Group discovery and search
- Member limits and permission controls

### Event Management
- Create events within groups
- Location and timing management
- RSVP system with guest allowance
- Event updates with member notifications

### Real-time Features
- Live RSVP updates
- Push notifications for events
- Real-time group activity
- Offline-first data caching

## Brazilian Localization

### Language & Culture
- Complete Portuguese Brazilian interface
- Brazilian date/time formats
- Cultural color themes (Brazilian flag colors)
- Local timezone support (America/Sao_Paulo)

### Color Palette
```typescript
const colors = {
  primary: {
    main: '#20B2AA',      // Teal
    dark: '#008B8B',      // Dark teal
    light: '#48CAE4',     // Light teal
  },
  brazilian: {
    blue: '#002776',      // Brazilian blue
    yellow: '#FFDF00',    // Brazilian yellow
    green: '#009739',     // Brazilian green
  },
  semantic: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  }
}
```

## Data Model

### Core Entities
- **profiles**: User profile extension from Clerk
- **groups**: Community containers with visibility settings
- **memberships**: User-group relationships with roles
- **events**: Time-bound activities within groups
- **rsvps**: User responses to event invitations
- **notifications**: System notifications for users

### Key Relationships
- Users belong to multiple groups (many-to-many)
- Groups contain multiple events (one-to-many)
- Users RSVP to events (many-to-many)
- All data respects group membership boundaries

## API Design

### RESTful Endpoints
- `/api/v1/groups` - Group CRUD and membership
- `/api/v1/events` - Event management and RSVPs
- `/api/v1/users` - Profile and preferences
- Real-time subscriptions via Supabase WebSockets

### Authentication Flow (Following Clerk Expo Quickstart)
1. ClerkProvider wraps app at root level for auth state
2. expo-secure-store provides secure token caching
3. Custom sign-up/sign-in flows using useSignUp(), useSignIn() hooks
4. SignedIn/SignedOut components for conditional rendering
5. Supabase uses Clerk JWT for API authorization
6. Row Level Security enforces data access rules

## Development Guidelines

### Code Organization
- Use feature-based directory structure
- Componentize UI elements for reusability
- Keep business logic in services/hooks
- Follow React Native best practices

### Performance Considerations
- Lazy load screens and components
- Optimize images and use caching
- Implement pagination for lists
- Use React Query for intelligent caching
- Support offline functionality

### Security & Privacy
- Respect user privacy settings
- Implement proper data retention policies
- Use HTTPS for all communications
- Follow LGPD compliance requirements

## Recent Changes (Last 3 Updates)
1. **2025-01-17**: Completed implementation planning phase
   - Defined complete data model with Supabase schema
   - Created comprehensive API contracts
   - Established Brazilian color palette and localization
2. **2025-01-17**: Technology stack finalized
   - Selected Expo + Clerk + Supabase architecture
   - Defined real-time notification strategy
   - Planned offline-first caching approach
3. **2025-01-17**: Feature specification created
   - Identified core user stories and acceptance criteria
   - Documented functional requirements
   - Established scope and technical constraints

## Development Commands

### Setup & Installation
```bash
# Install dependencies
npm install

# Start Expo development server
npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android
```

### Database Management
```bash
# Reset and migrate database
npx supabase db reset

# Generate TypeScript types
npx supabase gen types typescript --local > src/types/database.ts

# Seed test data
npx supabase seed run
```

### Testing
```bash
# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Run tests with coverage
npm run test:coverage
```

### Building & Deployment
```bash
# Create development build
eas build --profile development

# Create preview build
eas build --profile preview

# Submit to app stores
eas submit
```

## Current Status
✅ Feature specification complete
✅ Implementation plan complete
✅ Data model designed
✅ API contracts defined
✅ Technology stack selected
🔄 Ready for task generation and development

Next phase: Generate detailed implementation tasks using `/tasks` command.