-- Grupito Initial Database Schema
-- This migration creates the core tables for the Grupito mobile app

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends Clerk auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Profile Information
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  location_city TEXT,
  location_state TEXT,

  -- Preferences
  notification_preferences JSONB DEFAULT '{"push_enabled": true, "email_enabled": true}',
  privacy_settings JSONB DEFAULT '{"profile_visible": true, "location_visible": false}',

  -- App Settings
  language TEXT DEFAULT 'pt-BR',
  timezone TEXT DEFAULT 'America/Sao_Paulo',

  CONSTRAINT valid_display_name CHECK (length(display_name) >= 2 AND length(display_name) <= 50)
);

-- Create groups table
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Basic Information
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,

  -- Media
  cover_image_url TEXT,
  avatar_url TEXT,

  -- Settings
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'hidden')),
  join_policy TEXT NOT NULL DEFAULT 'open' CHECK (join_policy IN ('open', 'approval', 'invitation')),
  max_members INTEGER DEFAULT 500 CHECK (max_members > 0 AND max_members <= 500),

  -- Location (optional)
  location_city TEXT,
  location_state TEXT,
  location_coordinates POINT,

  -- Metadata
  member_count INTEGER DEFAULT 0,
  event_count INTEGER DEFAULT 0,

  -- Owner
  created_by UUID NOT NULL REFERENCES profiles(id),

  CONSTRAINT valid_name CHECK (length(name) >= 3 AND length(name) <= 100),
  CONSTRAINT valid_description CHECK (description IS NULL OR length(description) <= 500)
);

-- Create memberships table
CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Relationships
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,

  -- Role and Status
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('creator', 'admin', 'member')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'banned')),

  -- Timestamps
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  invited_by UUID REFERENCES profiles(id),

  -- Preferences
  notifications_enabled BOOLEAN DEFAULT TRUE,

  UNIQUE(user_id, group_id)
);

-- Create events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Basic Information
  title TEXT NOT NULL,
  description TEXT,

  -- Timing
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  timezone TEXT DEFAULT 'America/Sao_Paulo',

  -- Location
  location_name TEXT,
  location_address TEXT,
  location_coordinates POINT,
  is_online BOOLEAN DEFAULT FALSE,
  online_meeting_url TEXT,

  -- Capacity
  max_attendees INTEGER,
  current_attendees INTEGER DEFAULT 0,

  -- Settings
  rsvp_deadline TIMESTAMPTZ,
  allow_guests BOOLEAN DEFAULT FALSE,

  -- Media
  cover_image_url TEXT,

  -- Relationships
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),

  -- Status
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'cancelled')),

  CONSTRAINT valid_title CHECK (length(title) >= 3 AND length(title) <= 200),
  CONSTRAINT valid_timing CHECK (ends_at IS NULL OR starts_at < ends_at),
  CONSTRAINT valid_rsvp_deadline CHECK (rsvp_deadline IS NULL OR rsvp_deadline <= starts_at)
);

-- Create rsvps table
CREATE TABLE rsvps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Relationships
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,

  -- Response
  status TEXT NOT NULL CHECK (status IN ('going', 'not_going', 'maybe')),
  guests_count INTEGER DEFAULT 0 CHECK (guests_count >= 0),

  -- Optional
  note TEXT,

  UNIQUE(user_id, event_id),
  CONSTRAINT valid_note CHECK (note IS NULL OR length(note) <= 500)
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Recipient
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Content
  type TEXT NOT NULL CHECK (type IN ('event_created', 'event_updated', 'event_cancelled', 'rsvp_response', 'group_invitation', 'member_joined')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,

  -- Related Entities
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  related_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Status
  read_at TIMESTAMPTZ,

  -- Data
  data JSONB
);

-- Create group_categories table for predefined categories
CREATE TABLE group_categories (
  id TEXT PRIMARY KEY,
  name_pt TEXT NOT NULL,
  name_en TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  display_order INTEGER DEFAULT 0
);

-- Create group_invitations table
CREATE TABLE group_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),

  -- Relationships
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES profiles(id),
  invited_user_id UUID REFERENCES profiles(id),

  -- Contact Information (for non-users)
  email TEXT,
  phone TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  responded_at TIMESTAMPTZ,

  -- Validation
  CONSTRAINT valid_invitation CHECK (
    (invited_user_id IS NOT NULL) OR
    (email IS NOT NULL OR phone IS NOT NULL)
  )
);

-- Create indexes for performance
CREATE INDEX idx_profiles_display_name ON profiles(display_name);
CREATE INDEX idx_profiles_location ON profiles(location_city, location_state);

CREATE INDEX idx_groups_category ON groups(category);
CREATE INDEX idx_groups_visibility ON groups(visibility);
CREATE INDEX idx_groups_location ON groups(location_city, location_state);
CREATE INDEX idx_groups_created_by ON groups(created_by);

CREATE INDEX idx_memberships_user_id ON memberships(user_id);
CREATE INDEX idx_memberships_group_id ON memberships(group_id);
CREATE INDEX idx_memberships_role ON memberships(role);

CREATE INDEX idx_events_group_id ON events(group_id);
CREATE INDEX idx_events_starts_at ON events(starts_at);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_location ON events(location_coordinates) USING GIST;

CREATE INDEX idx_rsvps_event_id ON rsvps(event_id);
CREATE INDEX idx_rsvps_user_id ON rsvps(user_id);
CREATE INDEX idx_rsvps_status ON rsvps(status);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read_at ON notifications(user_id, read_at);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memberships_updated_at BEFORE UPDATE ON memberships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rsvps_updated_at BEFORE UPDATE ON rsvps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();