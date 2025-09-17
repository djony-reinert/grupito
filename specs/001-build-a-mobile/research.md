# Research: Grupito Mobile App Technology Decisions

## Overview
This document consolidates research findings for implementing the Grupito mobile application, resolving all technical clarifications identified in the feature specification.

## Authentication Method Resolution

**Decision**: Clerk Authentication (following official Expo quickstart)
**Rationale**:
- Official @clerk/clerk-expo SDK with React Native optimization
- ClerkProvider wrapper for app-wide authentication state
- Built-in secure token caching with expo-secure-store
- Pre-built components: SignedIn, SignedOut for conditional rendering
- Hooks: useSignUp(), useSignIn(), useAuth() for auth flows
- Support for social logins (Google, Apple, Facebook)
- Brazilian phone number support for SMS authentication
- GDPR/LGPD compliant user data handling

**Implementation Approach** (per Clerk docs):
1. Install @clerk/clerk-expo and expo-secure-store
2. Configure ClerkProvider at app root
3. Set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in environment
4. Use secure token cache for production
5. Implement custom sign-up/sign-in flows with error handling
6. Use conditional rendering components for auth states

**Alternatives Considered**:
- Firebase Auth: Good but Google-centric, less flexible customization
- Auth0: Enterprise-focused, more complex setup
- Supabase Auth: Considered but Clerk has better mobile UX components

## Platform Support and Versions

**Decision**:
- iOS 13.0+ (supports iPhone 6s and newer)
- Android API Level 21+ (Android 5.0+)
- Expo SDK 50+ with React Native 0.73+

**Rationale**:
- Covers 95%+ of Brazilian mobile users
- Allows modern React Native features and performance
- Expo managed workflow provides OTA updates for Brazilian users with slower update cycles

**Alternatives Considered**:
- iOS 14+/Android API 23+: Would exclude ~15% of Brazilian devices
- Bare React Native: More complex setup, no OTA updates

## Notification System

**Decision**:
- Push notifications via Expo Notifications API
- In-app notifications for RSVP updates
- Email notifications for important events (via Supabase Edge Functions)

**Types of Notifications**:
- New event created in user's groups
- Event updates (time, location changes)
- RSVP responses from other members
- Event reminders (24h and 2h before)
- Group invitation notifications

**Rationale**:
- Expo Notifications handles iOS/Android push setup automatically
- Real-time in-app updates via Supabase subscriptions
- Email backup ensures important notifications aren't missed

## Role and Permission System

**Decision**: Three-tier permission system
1. **Group Creator**: Full admin rights, can delete group, manage all settings
2. **Group Admin**: Can create events, manage members, moderate content
3. **Member**: Can view events, RSVP, create discussions

**Event Permissions**:
- Event creators can edit/cancel their events
- Group admins can moderate any event in their groups
- Members can only RSVP and comment

**Rationale**:
- Simple enough for casual use
- Flexible enough for organized communities
- Prevents chaos while enabling community management

## Group Visibility and Discovery

**Decision**:
- **Private Groups**: Invitation only, not discoverable
- **Public Groups**: Searchable, can request to join
- **Hidden Groups**: Invitation only, not searchable (for sensitive communities)

**Discovery Features**:
- Search by group name, description, category
- Browse by categories (Sports, Food, Culture, Professional, etc.)
- Location-based discovery (groups in your city)
- Suggested groups based on joined groups

**Rationale**:
- Flexibility for both casual friend groups and public communities
- Privacy options for sensitive groups
- Discovery features help grow the platform

## Scale and Performance Limits

**Decision**:
- Maximum 500 members per group
- Maximum 50 concurrent events per group
- Maximum 1000 groups per user
- Real-time updates for groups <100 members, polling for larger groups

**Performance Targets**:
- App launch: <2 seconds
- Screen transitions: <300ms
- Data sync: <1 second on 4G
- Offline support: 7 days cached data

**Rationale**:
- Limits prevent performance degradation
- Supports both small friend groups and large communities
- Brazilian mobile data considerations (offline support crucial)

## Data Retention and Privacy

**Decision**:
- User data retained until account deletion
- Event data: 2 years after event date
- RSVP data: 1 year after event date
- Message/chat data: 5 years (legal requirement consideration)
- Soft delete with 30-day recovery period

**LGPD Compliance**:
- User consent for data processing
- Right to data portability (export feature)
- Right to deletion with verification
- Clear privacy policy in Portuguese

**Rationale**:
- Complies with Brazilian LGPD (Lei Geral de Proteção de Dados)
- Balances data utility with privacy rights
- Reasonable retention for event history and planning

## Mobile-Specific Considerations

### Offline Capabilities
**Decision**:
- Cache viewed groups and upcoming events
- Offline RSVP with sync on reconnection
- Read-only access to cached content
- Clear indicators for offline status

### Performance Optimizations
**Decision**:
- React Query for intelligent caching
- Image optimization and lazy loading
- Pagination for large member/event lists
- Background sync for real-time updates

### Brazilian Network Conditions
**Decision**:
- Aggressive caching for poor connectivity
- Progressive image loading
- Retry logic for failed requests
- Data usage indicators and controls

## Color Palette and Branding

**Decision**: Extend existing grupito-old palette with mobile optimizations

**Primary Colors**:
- Primary Teal: #20B2AA (main brand color)
- Primary Dark: #008B8B (active states)
- Primary Light: #48CAE4 (backgrounds)

**Brazilian Accent Colors**:
- Brazilian Blue: #002776 (headers, important buttons)
- Brazilian Yellow: #FFDF00 (highlights, success states)
- Brazilian Green: #009739 (confirmations, positive actions)

**UI Colors**:
- Background: #FFFFFF / #1A1A1A (light/dark)
- Surface: #F8F9FA / #2D2D2D
- Text Primary: #2D3748 / #F7FAFC
- Text Secondary: #718096 / #A0AEC0

**Rationale**:
- Maintains brand consistency with existing web app
- Brazilian colors create cultural connection
- High contrast ensures accessibility
- Dark mode support for better UX

## Integration Architecture

**Decision**:
- Supabase for backend (database, real-time, storage)
- Clerk for authentication and user management
- Expo for mobile app framework and build pipeline
- Expo Application Services (EAS) for app distribution

**API Design**:
- RESTful API with Supabase Auto API
- Real-time subscriptions for live updates
- Row Level Security (RLS) for data protection
- Edge Functions for complex business logic

**Rationale**:
- Minimal backend maintenance
- Real-time features out of the box
- Scalable architecture for growth
- Fast development iteration

## Conclusion

All technical clarifications from the feature specification have been resolved with decisions that prioritize:
1. **User Experience**: Fast, intuitive mobile interface
2. **Brazilian Context**: Portuguese UI, cultural colors, network considerations
3. **Scalability**: Can grow from small groups to large communities
4. **Maintainability**: Modern, well-supported technology stack
5. **Compliance**: LGPD privacy requirements and data handling

These decisions form the foundation for the detailed design phase.