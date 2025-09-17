-- Grupito Row Level Security Policies
-- This migration sets up RLS policies for secure data access

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_invitations ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (
    privacy_settings->>'profile_visible' = 'true' OR
    auth.uid() = id
  );

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Groups policies
CREATE POLICY "Groups visibility" ON groups
  FOR SELECT USING (
    visibility = 'public' OR
    (visibility = 'private' AND EXISTS (
      SELECT 1 FROM memberships
      WHERE group_id = groups.id AND user_id = auth.uid() AND status = 'active'
    ))
  );

CREATE POLICY "Authenticated users can create groups" ON groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group admins can update" ON groups
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE group_id = groups.id AND user_id = auth.uid()
      AND role IN ('creator', 'admin') AND status = 'active'
    )
  );

CREATE POLICY "Group creators can delete" ON groups
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE group_id = groups.id AND user_id = auth.uid()
      AND role = 'creator' AND status = 'active'
    )
  );

-- Memberships policies
CREATE POLICY "Members can view group memberships" ON memberships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships m2
      WHERE m2.group_id = memberships.group_id AND m2.user_id = auth.uid() AND m2.status = 'active'
    )
  );

CREATE POLICY "Group admins can manage memberships" ON memberships
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM memberships m2
      WHERE m2.group_id = memberships.group_id AND m2.user_id = auth.uid()
      AND m2.role IN ('creator', 'admin') AND m2.status = 'active'
    )
  );

CREATE POLICY "Users can manage own membership" ON memberships
  FOR ALL USING (user_id = auth.uid());

-- Events policies
CREATE POLICY "Events visible to group members" ON events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE group_id = events.group_id AND user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Group members can create events" ON events
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM memberships
      WHERE group_id = events.group_id AND user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Event creators and group admins can update" ON events
  FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM memberships
      WHERE group_id = events.group_id AND user_id = auth.uid()
      AND role IN ('creator', 'admin') AND status = 'active'
    )
  );

CREATE POLICY "Event creators and group admins can delete" ON events
  FOR DELETE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM memberships
      WHERE group_id = events.group_id AND user_id = auth.uid()
      AND role IN ('creator', 'admin') AND status = 'active'
    )
  );

-- RSVPs policies
CREATE POLICY "RSVPs visible for event attendees" ON rsvps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships m
      JOIN events e ON e.group_id = m.group_id
      WHERE e.id = rsvps.event_id AND m.user_id = auth.uid() AND m.status = 'active'
    )
  );

CREATE POLICY "Users can manage own RSVPs" ON rsvps
  FOR ALL USING (user_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- System can insert notifications
CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Group invitations policies
CREATE POLICY "Users can view own invitations" ON group_invitations
  FOR SELECT USING (
    invited_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM memberships
      WHERE group_id = group_invitations.group_id AND user_id = auth.uid()
      AND role IN ('creator', 'admin') AND status = 'active'
    )
  );

CREATE POLICY "Group admins can manage invitations" ON group_invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE group_id = group_invitations.group_id AND user_id = auth.uid()
      AND role IN ('creator', 'admin') AND status = 'active'
    )
  );

-- Create functions for handling member count updates
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE groups
    SET member_count = member_count + 1
    WHERE id = NEW.group_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE groups
    SET member_count = member_count - 1
    WHERE id = OLD.group_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle status changes
    IF OLD.status = 'active' AND NEW.status != 'active' THEN
      UPDATE groups
      SET member_count = member_count - 1
      WHERE id = NEW.group_id;
    ELSIF OLD.status != 'active' AND NEW.status = 'active' THEN
      UPDATE groups
      SET member_count = member_count + 1
      WHERE id = NEW.group_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for member count
CREATE TRIGGER update_group_member_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON memberships
  FOR EACH ROW EXECUTE FUNCTION update_group_member_count();

-- Create function for handling RSVP count updates
CREATE OR REPLACE FUNCTION update_event_attendee_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'going' THEN
      UPDATE events
      SET current_attendees = current_attendees + 1 + COALESCE(NEW.guests_count, 0)
      WHERE id = NEW.event_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status = 'going' THEN
      UPDATE events
      SET current_attendees = current_attendees - 1 - COALESCE(OLD.guests_count, 0)
      WHERE id = OLD.event_id;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle status or guest count changes
    IF OLD.status = 'going' AND NEW.status != 'going' THEN
      UPDATE events
      SET current_attendees = current_attendees - 1 - COALESCE(OLD.guests_count, 0)
      WHERE id = NEW.event_id;
    ELSIF OLD.status != 'going' AND NEW.status = 'going' THEN
      UPDATE events
      SET current_attendees = current_attendees + 1 + COALESCE(NEW.guests_count, 0)
      WHERE id = NEW.event_id;
    ELSIF OLD.status = 'going' AND NEW.status = 'going' AND OLD.guests_count != NEW.guests_count THEN
      UPDATE events
      SET current_attendees = current_attendees + (COALESCE(NEW.guests_count, 0) - COALESCE(OLD.guests_count, 0))
      WHERE id = NEW.event_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for RSVP count
CREATE TRIGGER update_event_attendee_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON rsvps
  FOR EACH ROW EXECUTE FUNCTION update_event_attendee_count();