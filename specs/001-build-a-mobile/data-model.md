# Data Model: Grupito Mobile App

## Database Schema Design

### Core Entities

#### 1. profiles
Extends Clerk user data with app-specific information.

```sql
profiles (
  id: uuid PRIMARY KEY REFERENCES auth.users(id),
  created_at: timestamptz DEFAULT now(),
  updated_at: timestamptz DEFAULT now(),

  -- Profile Information
  display_name: text NOT NULL,
  bio: text,
  avatar_url: text,
  location_city: text,
  location_state: text,

  -- Preferences
  notification_preferences: jsonb DEFAULT '{"push_enabled": true, "email_enabled": true}',
  privacy_settings: jsonb DEFAULT '{"profile_visible": true, "location_visible": false}',

  -- App Settings
  language: text DEFAULT 'pt-BR',
  timezone: text DEFAULT 'America/Sao_Paulo',

  CONSTRAINT valid_display_name CHECK (length(display_name) >= 2 AND length(display_name) <= 50)
)
```

#### 2. groups
Core entity representing communities of users.

```sql
groups (
  id: uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at: timestamptz DEFAULT now(),
  updated_at: timestamptz DEFAULT now(),

  -- Basic Information
  name: text NOT NULL,
  description: text,
  category: text NOT NULL,

  -- Media
  cover_image_url: text,
  avatar_url: text,

  -- Settings
  visibility: text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'hidden')),
  join_policy: text NOT NULL DEFAULT 'open' CHECK (join_policy IN ('open', 'approval', 'invitation')),
  max_members: integer DEFAULT 500 CHECK (max_members > 0 AND max_members <= 500),

  -- Location (optional)
  location_city: text,
  location_state: text,
  location_coordinates: point,

  -- Metadata
  member_count: integer DEFAULT 0,
  event_count: integer DEFAULT 0,

  -- Owner
  created_by: uuid NOT NULL REFERENCES profiles(id),

  CONSTRAINT valid_name CHECK (length(name) >= 3 AND length(name) <= 100),
  CONSTRAINT valid_description CHECK (description IS NULL OR length(description) <= 500)
)
```

#### 3. memberships
Represents user membership in groups with roles.

```sql
memberships (
  id: uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at: timestamptz DEFAULT now(),
  updated_at: timestamptz DEFAULT now(),

  -- Relationships
  user_id: uuid NOT NULL REFERENCES profiles(id),
  group_id: uuid NOT NULL REFERENCES groups(id),

  -- Role and Status
  role: text NOT NULL DEFAULT 'member' CHECK (role IN ('creator', 'admin', 'member')),
  status: text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'banned')),

  -- Timestamps
  joined_at: timestamptz DEFAULT now(),
  invited_by: uuid REFERENCES profiles(id),

  -- Preferences
  notifications_enabled: boolean DEFAULT true,

  UNIQUE(user_id, group_id)
)
```

#### 4. events
Time-bound activities within groups.

```sql
events (
  id: uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at: timestamptz DEFAULT now(),
  updated_at: timestamptz DEFAULT now(),

  -- Basic Information
  title: text NOT NULL,
  description: text,

  -- Timing
  starts_at: timestamptz NOT NULL,
  ends_at: timestamptz,
  timezone: text DEFAULT 'America/Sao_Paulo',

  -- Location
  location_name: text,
  location_address: text,
  location_coordinates: point,
  is_online: boolean DEFAULT false,
  online_meeting_url: text,

  -- Capacity
  max_attendees: integer,
  current_attendees: integer DEFAULT 0,

  -- Settings
  rsvp_deadline: timestamptz,
  allow_guests: boolean DEFAULT false,

  -- Media
  cover_image_url: text,

  -- Relationships
  group_id: uuid NOT NULL REFERENCES groups(id),
  created_by: uuid NOT NULL REFERENCES profiles(id),

  -- Status
  status: text NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'cancelled')),

  CONSTRAINT valid_title CHECK (length(title) >= 3 AND length(title) <= 200),
  CONSTRAINT valid_timing CHECK (ends_at IS NULL OR starts_at < ends_at),
  CONSTRAINT valid_rsvp_deadline CHECK (rsvp_deadline IS NULL OR rsvp_deadline <= starts_at)
)
```

#### 5. rsvps
User responses to event invitations.

```sql
rsvps (
  id: uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at: timestamptz DEFAULT now(),
  updated_at: timestamptz DEFAULT now(),

  -- Relationships
  user_id: uuid NOT NULL REFERENCES profiles(id),
  event_id: uuid NOT NULL REFERENCES events(id),

  -- Response
  status: text NOT NULL CHECK (status IN ('going', 'not_going', 'maybe')),
  guests_count: integer DEFAULT 0 CHECK (guests_count >= 0),

  -- Optional
  note: text,

  UNIQUE(user_id, event_id),
  CONSTRAINT valid_note CHECK (note IS NULL OR length(note) <= 500)
)
```

#### 6. notifications
System notifications for users.

```sql
notifications (
  id: uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at: timestamptz DEFAULT now(),

  -- Recipient
  user_id: uuid NOT NULL REFERENCES profiles(id),

  -- Content
  type: text NOT NULL CHECK (type IN ('event_created', 'event_updated', 'event_cancelled', 'rsvp_response', 'group_invitation', 'member_joined')),
  title: text NOT NULL,
  body: text NOT NULL,

  -- Related Entities
  group_id: uuid REFERENCES groups(id),
  event_id: uuid REFERENCES events(id),
  related_user_id: uuid REFERENCES profiles(id),

  -- Status
  read_at: timestamptz,

  -- Data
  data: jsonb
)
```

### Supporting Entities

#### 7. group_categories
Predefined categories for group classification.

```sql
group_categories (
  id: text PRIMARY KEY,
  name_pt: text NOT NULL,
  name_en: text NOT NULL,
  icon: text NOT NULL,
  color: text NOT NULL,
  display_order: integer DEFAULT 0
)
```

#### 8. group_invitations
Pending invitations to join groups.

```sql
group_invitations (
  id: uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at: timestamptz DEFAULT now(),
  expires_at: timestamptz DEFAULT (now() + interval '7 days'),

  -- Relationships
  group_id: uuid NOT NULL REFERENCES groups(id),
  invited_by: uuid NOT NULL REFERENCES profiles(id),
  invited_user_id: uuid REFERENCES profiles(id),

  -- Contact Information (for non-users)
  email: text,
  phone: text,

  -- Status
  status: text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  responded_at: timestamptz,

  -- Validation
  CONSTRAINT valid_invitation CHECK (
    (invited_user_id IS NOT NULL) OR
    (email IS NOT NULL OR phone IS NOT NULL)
  )
)
```

## Relationships and Constraints

### Key Relationships
1. **User → Groups**: Many-to-many through memberships
2. **Groups → Events**: One-to-many
3. **Users → Events**: Many-to-many through RSVPs
4. **Users → Notifications**: One-to-many

### Business Rules
1. **Group Creator**: Automatically gets 'creator' role in membership
2. **Event Creator**: Must be member of the group
3. **RSVP Limits**: Cannot exceed event max_attendees
4. **Group Limits**: Cannot exceed max_members per group
5. **Notification Privacy**: Only members see group events

### Indexes for Performance

```sql
-- User lookups
CREATE INDEX idx_profiles_display_name ON profiles(display_name);
CREATE INDEX idx_profiles_location ON profiles(location_city, location_state);

-- Group discovery
CREATE INDEX idx_groups_category ON groups(category);
CREATE INDEX idx_groups_visibility ON groups(visibility);
CREATE INDEX idx_groups_location ON groups(location_city, location_state);
CREATE INDEX idx_groups_created_by ON groups(created_by);

-- Membership queries
CREATE INDEX idx_memberships_user_id ON memberships(user_id);
CREATE INDEX idx_memberships_group_id ON memberships(group_id);
CREATE INDEX idx_memberships_role ON memberships(role);

-- Event queries
CREATE INDEX idx_events_group_id ON events(group_id);
CREATE INDEX idx_events_starts_at ON events(starts_at);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_location ON events(location_coordinates) USING GIST;

-- RSVP lookups
CREATE INDEX idx_rsvps_event_id ON rsvps(event_id);
CREATE INDEX idx_rsvps_user_id ON rsvps(user_id);
CREATE INDEX idx_rsvps_status ON rsvps(status);

-- Notification queries
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read_at ON notifications(user_id, read_at);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
```

## Row Level Security (RLS) Policies

### profiles
```sql
-- Users can view public profiles and their own
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (privacy_settings->>'profile_visible' = 'true' OR auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

### groups
```sql
-- Public and member-visible groups
CREATE POLICY "Groups visibility" ON groups
  FOR SELECT USING (
    visibility = 'public' OR
    (visibility = 'private' AND EXISTS (
      SELECT 1 FROM memberships
      WHERE group_id = groups.id AND user_id = auth.uid() AND status = 'active'
    ))
  );

-- Members can update if they have admin+ role
CREATE POLICY "Group admins can update" ON groups
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE group_id = groups.id AND user_id = auth.uid()
      AND role IN ('creator', 'admin') AND status = 'active'
    )
  );
```

### events
```sql
-- Events visible to group members
CREATE POLICY "Events visible to group members" ON events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE group_id = events.group_id AND user_id = auth.uid() AND status = 'active'
    )
  );

-- Event creators and group admins can update
CREATE POLICY "Event creators and admins can update" ON events
  FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM memberships
      WHERE group_id = events.group_id AND user_id = auth.uid()
      AND role IN ('creator', 'admin') AND status = 'active'
    )
  );
```

### rsvps
```sql
-- Users can see RSVPs for events they're invited to
CREATE POLICY "RSVPs visible for event attendees" ON rsvps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships m
      JOIN events e ON e.group_id = m.group_id
      WHERE e.id = rsvps.event_id AND m.user_id = auth.uid() AND m.status = 'active'
    )
  );

-- Users can manage their own RSVPs
CREATE POLICY "Users can manage own RSVPs" ON rsvps
  FOR ALL USING (user_id = auth.uid());
```

## State Transitions

### Group Status Flow
```
draft → published → archived
  ↓         ↓
hidden   private/public
```

### Event Status Flow
```
draft → published → cancelled
         ↓
      (time passes)
         ↓
      completed
```

### RSVP Status Flow
```
(no response) → going/not_going/maybe
                 ↓
            (can change until deadline)
```

### Membership Status Flow
```
invited → pending → active
           ↓         ↓
        declined   banned
```

This data model supports all the functional requirements while maintaining performance, security, and scalability for the expected user base.