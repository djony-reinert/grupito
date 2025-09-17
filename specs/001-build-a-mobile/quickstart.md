# Quickstart: Grupito Mobile App

## Overview
This quickstart guide validates the core user flows for the Grupito mobile application by testing the essential features: user onboarding, group creation, event management, and RSVP functionality.

## Prerequisites
- Expo CLI installed (`npm install -g @expo/cli`)
- Node.js 18+ and npm/yarn
- iOS Simulator (for iOS testing) or Android Emulator (for Android testing)
- Clerk account with test application configured
- Supabase project with database schema deployed

## Environment Setup

### 1. Clone and Install
```bash
git clone <repository-url>
cd grupito
npm install

# Install Clerk and secure storage (per Clerk Expo quickstart)
npm install @clerk/clerk-expo expo-secure-store
```

### 2. Environment Configuration
Create `.env.local` with:
```bash
# Clerk Configuration (from Clerk Dashboard)
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...

# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App Configuration
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1
```

### 3. Database Setup
```bash
# Run database migrations
npx supabase db reset
npx supabase db push

# Seed test data
npx supabase seed run
```

### 4. Start Development
```bash
# Start Expo development server
npx expo start

# Start API server (if running local backend)
npm run api:dev
```

## Core User Flow Tests

### Test 1: User Onboarding and Authentication

**Objective**: Verify user can sign up, sign in, and complete profile setup

**Steps**:
1. Launch app in simulator/emulator
2. Tap "Começar" (Get Started) button
3. Sign up with email and password
4. Verify email (use Clerk test mode for instant verification)
5. Complete profile setup:
   - Display name: "Teste Usuário"
   - Location: "São Paulo, SP"
   - Bio: "Testando o app Grupito"
6. Upload avatar (optional)
7. Tap "Salvar Perfil"

**Expected Results**:
- ✅ User successfully creates account
- ✅ Profile information is saved
- ✅ User lands on main app screen (groups list)
- ✅ Navigation shows Portuguese text
- ✅ User avatar appears in navigation

### Test 2: Group Creation and Setup

**Objective**: Verify user can create a group and configure its settings

**Steps**:
1. From main screen, tap "+" button
2. Select "Criar Grupo"
3. Fill group creation form:
   - Name: "Grupo de Teste"
   - Description: "Grupo para testar funcionalidades"
   - Category: Select "Esportes"
   - Visibility: "Público"
   - Location: "São Paulo, SP"
4. Upload group cover image (optional)
5. Tap "Criar Grupo"
6. Verify group appears in user's groups list
7. Enter group details screen
8. Verify user has "Criador" role

**Expected Results**:
- ✅ Group is created successfully
- ✅ User becomes group creator automatically
- ✅ Group appears in user's groups list
- ✅ Group details show correct information
- ✅ Member count shows 1

### Test 3: Event Creation and Management

**Objective**: Verify user can create events within groups and manage them

**Steps**:
1. Navigate to "Grupo de Teste" from previous test
2. Tap "Criar Evento" button
3. Fill event creation form:
   - Title: "Evento de Teste"
   - Description: "Primeiro evento do grupo"
   - Date: Tomorrow's date
   - Time: 18:00
   - Location: "Parque Ibirapuera"
   - Max participants: 20
4. Tap "Criar Evento"
5. Verify event appears in group's events list
6. Tap on event to view details
7. Verify event information is correct
8. Edit event (change time to 19:00)
9. Save changes

**Expected Results**:
- ✅ Event is created successfully
- ✅ Event shows in group events list
- ✅ Event details display correctly
- ✅ User can edit event as creator
- ✅ Changes are saved and reflected

### Test 4: Member Invitation and Management

**Objective**: Verify group creators can invite members and manage the group

**Steps**:
1. In "Grupo de Teste", tap "Gerenciar Membros"
2. Tap "Convidar Membros"
3. Enter test email: "teste2@example.com"
4. Send invitation
5. Create a second test user account (use different email)
6. Log in with second user
7. Accept group invitation
8. Return to first user account
9. Verify second user appears in members list
10. Test changing member role to "Admin"

**Expected Results**:
- ✅ Invitation is sent successfully
- ✅ Second user receives invitation notification
- ✅ Second user can join group
- ✅ Member count updates to 2
- ✅ Group creator can manage member roles

### Test 5: RSVP Workflow and Real-time Updates

**Objective**: Verify RSVP system works with real-time updates

**Steps**:
1. With second user account, navigate to "Grupo de Teste"
2. View "Evento de Teste" created earlier
3. Tap "Confirmar Presença"
4. Select "Vou Participar" (Going)
5. Add note: "Estou animado!"
6. Save RSVP
7. Switch to first user account (group creator)
8. View same event
9. Verify RSVP count updated to 1
10. View attendees list
11. Verify second user appears as "Confirmado"

**Expected Results**:
- ✅ RSVP is saved successfully
- ✅ Event attendee count updates immediately
- ✅ Creator can see who's attending
- ✅ Real-time updates work without refresh
- ✅ RSVP note is displayed

### Test 6: Notifications and Real-time Features

**Objective**: Verify notification system and real-time capabilities

**Steps**:
1. With first user (creator), edit "Evento de Teste"
2. Change event time from 19:00 to 20:00
3. Save changes
4. Switch to second user account
5. Check notifications (bell icon)
6. Verify notification about event update
7. Tap notification to view event
8. Verify updated time is shown
9. Test push notification (if configured)

**Expected Results**:
- ✅ Event update notification is sent
- ✅ Notification appears in notifications list
- ✅ Tapping notification navigates to event
- ✅ Event shows updated information
- ✅ Push notification received (if enabled)

### Test 7: Offline Capability

**Objective**: Verify app works offline for cached content

**Steps**:
1. Ensure app has loaded group and event data
2. Turn off device internet connection
3. Navigate to groups list
4. Tap on "Grupo de Teste"
5. View group events
6. View event details
7. Attempt to RSVP (should show offline message)
8. Turn internet back on
9. Verify data syncs when connection restored

**Expected Results**:
- ✅ Groups list loads from cache
- ✅ Group details load from cache
- ✅ Events display from cache
- ✅ Offline indicators shown for actions
- ✅ Data syncs when connection restored

## Performance Validation

### Launch Time Test
- App should launch within 2 seconds on simulator
- First screen should appear within 1 second
- Authentication should complete within 3 seconds

### Navigation Performance
- Screen transitions should be smooth (60fps)
- Tab switches should take < 300ms
- List scrolling should be fluid without lag

### Data Loading Test
- Group list should load within 1 second
- Event details should load within 500ms
- Images should load progressively

## UI/UX Validation

### Brazilian Portuguese Interface
- ✅ All user-facing text is in Portuguese Brazilian
- ✅ Date/time formats use Brazilian standards
- ✅ Currency (if used) shows Brazilian Real (R$)

### Color Palette Verification
- ✅ Primary color is teal (#20B2AA)
- ✅ Brazilian accent colors are used appropriately
- ✅ Dark mode works correctly (if implemented)

### Accessibility Testing
- ✅ Text has sufficient contrast ratios
- ✅ Touch targets are at least 44x44pt
- ✅ VoiceOver/TalkBack work correctly
- ✅ Text scales properly with device settings

## Error Handling Validation

### Network Error Testing
1. Disconnect internet during API call
2. Verify error message is user-friendly in Portuguese
3. Verify retry mechanism works
4. Test timeout handling

### Input Validation Testing
1. Test form validation with invalid inputs
2. Verify error messages are clear and in Portuguese
3. Test edge cases (very long names, special characters)

## Success Criteria

The quickstart is successful if:

1. **Core Flows Work**: All 7 test scenarios pass completely
2. **Performance Meets Targets**: Launch time, navigation, and loading metrics pass
3. **UI Standards Met**: Portuguese interface, color palette, accessibility requirements pass
4. **Error Handling Works**: Network errors and input validation work properly
5. **Real-time Features Function**: Notifications and live updates work as expected

## Troubleshooting

### Common Issues

**Expo Build Errors:**
```bash
# Clear cache and reinstall
npx expo install --fix
npx expo start -c
```

**Authentication Issues:**
- Verify Clerk keys in environment variables
- Check Clerk dashboard for app configuration
- Ensure test mode is enabled for development

**Database Connection Issues:**
- Verify Supabase URL and keys
- Check Row Level Security policies
- Run database migrations

**Real-time Not Working:**
- Verify Supabase Realtime is enabled
- Check subscription permissions
- Test with browser network tab for websocket connections

### Support
For issues with this quickstart, check:
1. Environment configuration
2. Clerk and Supabase dashboards
3. Device/simulator console logs
4. Network connectivity

This quickstart validates that the core Grupito mobile app functionality works end-to-end with the designed user experience.