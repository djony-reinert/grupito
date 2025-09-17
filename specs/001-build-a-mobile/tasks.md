# Tasks: Grupito Mobile App

**Input**: Design documents from `/specs/001-build-a-mobile/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → ✅ LOADED: Mobile app with Expo + Clerk + Supabase
   → ✅ EXTRACTED: TypeScript, React Native, @clerk/clerk-expo
2. Load optional design documents:
   → ✅ data-model.md: 6 entities (profiles, groups, memberships, events, rsvps, notifications)
   → ✅ contracts/: 3 API files (groups-api.md, events-api.md, users-api.md)
   → ✅ research.md: Clerk auth implementation, Brazilian localization
3. Generate tasks by category:
   → ✅ Setup: Expo project, dependencies, database
   → ✅ Tests: 24 contract/integration tests
   → ✅ Core: 6 models, services, 12 API endpoints, mobile screens
   → ✅ Integration: Authentication, real-time, offline support
   → ✅ Polish: Unit tests, performance, documentation
4. Apply task rules:
   → ✅ Different files = mark [P] for parallel
   → ✅ Same file = sequential (no [P])
   → ✅ Tests before implementation (TDD)
5. Number tasks sequentially (T001-T037)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → ✅ All contracts have tests (24 tests for 3 APIs)
   → ✅ All entities have models (6 models)
   → ✅ All endpoints implemented (12 endpoints)
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Mobile**: `mobile/src/`, `mobile/__tests__/`
- **API**: `api/src/`, `api/tests/`
- Paths follow mobile + API structure from plan.md

## Phase 3.1: Setup

- [ ] T001 Create Expo mobile project structure with TypeScript
  - Initialize `mobile/` directory
  - Run `npx create-expo-app@latest mobile --template tabs --typescript`
  - Configure project for development builds

- [ ] T002 Initialize Supabase API project structure
  - Create `api/` directory with `src/`, `tests/`, `supabase/` subdirectories
  - Initialize Supabase project: `npx supabase init`
  - Setup database connection and environment

- [ ] T003 [P] Install and configure mobile dependencies
  - Install: `@clerk/clerk-expo expo-secure-store @supabase/supabase-js @tanstack/react-query zustand`
  - Install navigation: `@react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack`
  - Configure in `mobile/package.json` and `mobile/app.json`

- [ ] T004 [P] Configure linting and formatting for mobile
  - Setup ESLint, Prettier for TypeScript React Native
  - Configure in `mobile/.eslintrc.js` and `mobile/.prettierrc`
  - Add scripts to `mobile/package.json`

- [ ] T005 [P] Setup database schema and migrations
  - Create schema in `api/supabase/migrations/001_initial_schema.sql`
  - Include all 6 entities from data-model.md
  - Setup Row Level Security policies

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### API Contract Tests
- [ ] T006 [P] Contract test Groups API GET /groups in `api/tests/contract/groups_get.test.ts`
- [ ] T007 [P] Contract test Groups API POST /groups in `api/tests/contract/groups_post.test.ts`
- [ ] T008 [P] Contract test Groups API PUT /groups/{id} in `api/tests/contract/groups_put.test.ts`
- [ ] T009 [P] Contract test Groups API GET /groups/{id}/members in `api/tests/contract/groups_members.test.ts`

- [ ] T010 [P] Contract test Events API GET /events in `api/tests/contract/events_get.test.ts`
- [ ] T011 [P] Contract test Events API POST /events in `api/tests/contract/events_post.test.ts`
- [ ] T012 [P] Contract test Events API PUT /events/{id} in `api/tests/contract/events_put.test.ts`
- [ ] T013 [P] Contract test Events API POST /events/{id}/rsvp in `api/tests/contract/events_rsvp.test.ts`

- [ ] T014 [P] Contract test Users API GET /users/me in `api/tests/contract/users_get.test.ts`
- [ ] T015 [P] Contract test Users API PUT /users/me in `api/tests/contract/users_put.test.ts`
- [ ] T016 [P] Contract test Users API GET /users/me/notifications in `api/tests/contract/users_notifications.test.ts`

### Mobile Integration Tests
- [ ] T017 [P] Integration test user onboarding flow in `mobile/__tests__/integration/onboarding.test.tsx`
- [ ] T018 [P] Integration test group creation flow in `mobile/__tests__/integration/group_creation.test.tsx`
- [ ] T019 [P] Integration test event creation flow in `mobile/__tests__/integration/event_creation.test.tsx`
- [ ] T020 [P] Integration test RSVP workflow in `mobile/__tests__/integration/rsvp_workflow.test.tsx`
- [ ] T021 [P] Integration test member management in `mobile/__tests__/integration/member_management.test.tsx`
- [ ] T022 [P] Integration test offline functionality in `mobile/__tests__/integration/offline.test.tsx`

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Database Models
- [ ] T023 [P] Profile model in `api/src/models/Profile.ts`
- [ ] T024 [P] Group model in `api/src/models/Group.ts`
- [ ] T025 [P] Membership model in `api/src/models/Membership.ts`
- [ ] T026 [P] Event model in `api/src/models/Event.ts`
- [ ] T027 [P] RSVP model in `api/src/models/RSVP.ts`
- [ ] T028 [P] Notification model in `api/src/models/Notification.ts`

### API Services and Endpoints
- [ ] T029 GroupService CRUD operations in `api/src/services/GroupService.ts`
- [ ] T030 Groups API endpoints (/groups, /groups/{id}, /groups/{id}/members) in `api/src/routes/groups.ts`
- [ ] T031 EventService CRUD and RSVP operations in `api/src/services/EventService.ts`
- [ ] T032 Events API endpoints (/events, /events/{id}, /events/{id}/rsvp) in `api/src/routes/events.ts`
- [ ] T033 UserService profile and notification operations in `api/src/services/UserService.ts`
- [ ] T034 Users API endpoints (/users/me, /users/me/notifications) in `api/src/routes/users.ts`

### Mobile Authentication & Core Setup
- [ ] T035 [P] Setup Clerk authentication provider in `mobile/src/providers/AuthProvider.tsx`
- [ ] T036 [P] Configure React Query and Zustand store in `mobile/src/providers/AppProvider.tsx`
- [ ] T037 [P] Create navigation structure in `mobile/src/navigation/AppNavigator.tsx`

### Mobile Screens
- [ ] T038 [P] Authentication screens (SignIn, SignUp, Profile Setup) in `mobile/src/screens/auth/`
- [ ] T039 [P] Groups list screen in `mobile/src/screens/groups/GroupsListScreen.tsx`
- [ ] T040 [P] Group details screen in `mobile/src/screens/groups/GroupDetailsScreen.tsx`
- [ ] T041 [P] Group creation screen in `mobile/src/screens/groups/CreateGroupScreen.tsx`
- [ ] T042 [P] Events list screen in `mobile/src/screens/events/EventsListScreen.tsx`
- [ ] T043 [P] Event details screen in `mobile/src/screens/events/EventDetailsScreen.tsx`
- [ ] T044 [P] Event creation screen in `mobile/src/screens/events/CreateEventScreen.tsx`

### Mobile Components and Services
- [ ] T045 [P] API client with Supabase integration in `mobile/src/services/ApiClient.ts`
- [ ] T046 [P] Groups service hooks in `mobile/src/hooks/useGroups.ts`
- [ ] T047 [P] Events service hooks in `mobile/src/hooks/useEvents.ts`
- [ ] T048 [P] User profile hooks in `mobile/src/hooks/useProfile.ts`

## Phase 3.4: Integration

- [ ] T049 Connect Clerk JWT with Supabase RLS in `api/src/middleware/auth.ts`
- [ ] T050 Setup real-time subscriptions for groups/events in `mobile/src/services/RealtimeService.ts`
- [ ] T051 Implement push notifications with Expo in `mobile/src/services/NotificationService.ts`
- [ ] T052 Setup offline caching with React Query in `mobile/src/services/OfflineService.ts`
- [ ] T053 Configure Brazilian Portuguese localization in `mobile/src/i18n/`
- [ ] T054 Implement Brazilian color theme in `mobile/src/theme/colors.ts`

## Phase 3.5: Polish

- [ ] T055 [P] Unit tests for GroupService in `api/tests/unit/GroupService.test.ts`
- [ ] T056 [P] Unit tests for EventService in `api/tests/unit/EventService.test.ts`
- [ ] T057 [P] Unit tests for UserService in `api/tests/unit/UserService.test.ts`
- [ ] T058 [P] Component unit tests in `mobile/__tests__/components/`
- [ ] T059 Performance optimization (image loading, list virtualization) in mobile app
- [ ] T060 [P] Update API documentation in `api/docs/`
- [ ] T061 [P] Update mobile app documentation in `mobile/README.md`
- [ ] T062 Run quickstart validation tests from quickstart.md

## Dependencies

### Critical Sequence Dependencies
- **Setup (T001-T005)** blocks all other phases
- **Tests (T006-T022)** MUST complete before **Core Implementation (T023-T048)**
- **Models (T023-T028)** block **Services (T029, T031, T033)**
- **Services** block **API Endpoints (T030, T032, T034)**
- **Auth Provider (T035)** blocks **Mobile Screens (T038-T044)**
- **Core Implementation (T023-T048)** blocks **Integration (T049-T054)**
- **Integration (T049-T054)** blocks **Polish (T055-T062)**

### File-Level Dependencies
- T029 (GroupService) requires T024 (Group model) and T025 (Membership model)
- T030 (Groups API) requires T029 (GroupService)
- T031 (EventService) requires T026 (Event model) and T027 (RSVP model)
- T032 (Events API) requires T031 (EventService)
- T033 (UserService) requires T023 (Profile model) and T028 (Notification model)
- T034 (Users API) requires T033 (UserService)
- T039-T044 (Mobile screens) require T037 (Navigation) and T035 (Auth Provider)

## Parallel Execution Examples

### Phase 3.2: All Test Tasks (after T005 complete)
```bash
# Launch T006-T022 together (17 test files):
Task: "Contract test Groups API GET /groups in api/tests/contract/groups_get.test.ts"
Task: "Contract test Groups API POST /groups in api/tests/contract/groups_post.test.ts"
Task: "Contract test Events API GET /events in api/tests/contract/events_get.test.ts"
Task: "Integration test user onboarding flow in mobile/__tests__/integration/onboarding.test.tsx"
# ... all 17 test tasks can run in parallel
```

### Phase 3.3: Model Creation (after tests fail)
```bash
# Launch T023-T028 together (6 model files):
Task: "Profile model in api/src/models/Profile.ts"
Task: "Group model in api/src/models/Group.ts"
Task: "Membership model in api/src/models/Membership.ts"
Task: "Event model in api/src/models/Event.ts"
Task: "RSVP model in api/src/models/RSVP.ts"
Task: "Notification model in api/src/models/Notification.ts"
```

### Phase 3.3: Mobile Core Setup (after T034 complete)
```bash
# Launch T035-T037 together (3 provider/navigation files):
Task: "Setup Clerk authentication provider in mobile/src/providers/AuthProvider.tsx"
Task: "Configure React Query and Zustand store in mobile/src/providers/AppProvider.tsx"
Task: "Create navigation structure in mobile/src/navigation/AppNavigator.tsx"
```

## Notes
- [P] tasks = different files, no shared dependencies
- Verify all contract tests fail before starting T023
- Run database migrations before starting API services
- Test mobile app on both iOS and Android simulators
- Commit after each completed task
- Avoid: implementing before tests exist, modifying same files in parallel

## Task Generation Rules
*Applied during main() execution*

1. **From Contracts**:
   - groups-api.md → 4 contract tests (T006-T009)
   - events-api.md → 4 contract tests (T010-T013)
   - users-api.md → 3 contract tests (T014-T016)

2. **From Data Model**:
   - 6 entities → 6 model creation tasks (T023-T028)
   - Relationships → service layer tasks (T029, T031, T033)

3. **From User Stories** (quickstart.md):
   - 6 integration test scenarios (T017-T022)
   - Validation tasks → quickstart execution (T062)

4. **Ordering**:
   - Setup (T001-T005) → Tests (T006-T022) → Models (T023-T028) → Services (T029-T034) → Mobile Core (T035-T048) → Integration (T049-T054) → Polish (T055-T062)

## Validation Checklist
*GATE: Checked by main() before returning*

- [x] All contracts have corresponding tests (11 contract tests for 3 APIs)
- [x] All entities have model tasks (6 models for 6 entities)
- [x] All tests come before implementation (T006-T022 before T023-T048)
- [x] Parallel tasks truly independent (different files, no shared state)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Critical user flows covered by integration tests
- [x] Mobile and API components properly separated
- [x] Brazilian localization and Clerk auth integration planned