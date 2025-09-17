import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { createSupabaseServiceClient } from '../../src/lib/supabase';
import app from '../../src/app';

describe('Groups API - PUT /groups/:id', () => {
  let supabase: any;
  let testUserId: string;
  let testUser2Id: string;
  let authToken: string;
  let authToken2: string;
  let testGroupIds: string[] = [];

  beforeAll(async () => {
    supabase = createSupabaseServiceClient();

    // Create test user 1
    const { data: user1, error: userError1 } = await supabase.auth.admin.createUser({
      email: 'test@example.com',
      password: 'test123456',
      email_confirm: true
    });

    if (userError1) throw userError1;
    testUserId = user1.user.id;

    // Create test user 2
    const { data: user2, error: userError2 } = await supabase.auth.admin.createUser({
      email: 'test2@example.com',
      password: 'test123456',
      email_confirm: true
    });

    if (userError2) throw userError2;
    testUser2Id = user2.user.id;

    // Create test profiles
    const { error: profileError1 } = await supabase
      .from('profiles')
      .insert({
        id: testUserId,
        display_name: 'Test User 1',
        bio: 'Test bio 1',
        location_city: 'São Paulo',
        location_state: 'SP'
      });

    if (profileError1) throw profileError1;

    const { error: profileError2 } = await supabase
      .from('profiles')
      .insert({
        id: testUser2Id,
        display_name: 'Test User 2',
        bio: 'Test bio 2'
      });

    if (profileError2) throw profileError2;

    // Get auth tokens
    const { data: signInData1, error: signInError1 } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'test123456'
    });

    if (signInError1) throw signInError1;
    authToken = signInData1.session.access_token;

    const { data: signInData2, error: signInError2 } = await supabase.auth.signInWithPassword({
      email: 'test2@example.com',
      password: 'test123456'
    });

    if (signInError2) throw signInError2;
    authToken2 = signInData2.session.access_token;
  });

  afterAll(async () => {
    // Clean up test data
    if (testGroupIds.length > 0) {
      await supabase
        .from('groups')
        .delete()
        .in('id', testGroupIds);
    }

    await supabase.from('profiles').delete().eq('id', testUserId);
    await supabase.from('profiles').delete().eq('id', testUser2Id);
    await supabase.auth.admin.deleteUser(testUserId);
    await supabase.auth.admin.deleteUser(testUser2Id);
  });

  beforeEach(async () => {
    // Clean up any existing test groups
    if (testGroupIds.length > 0) {
      await supabase
        .from('groups')
        .delete()
        .in('id', testGroupIds);
    }
    testGroupIds = [];
  });

  describe('Authentication', () => {
    let testGroupId: string;

    beforeEach(async () => {
      // Create a test group
      const { data: group, error } = await supabase
        .from('groups')
        .insert({
          name: 'Test Group',
          description: 'Test description',
          category: 'sports',
          created_by: testUserId
        })
        .select()
        .single();

      if (error) throw error;
      testGroupId = group.id;
      testGroupIds.push(testGroupId);
    });

    it('should return 401 when no authorization header provided', async () => {
      const updateData = {
        name: 'Updated Group Name'
      };

      const response = await request(app)
        .put(`/api/groups/${testGroupId}`)
        .send(updateData)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('authorization');
    });

    it('should return 401 with invalid JWT token', async () => {
      const updateData = {
        name: 'Updated Group Name'
      };

      const response = await request(app)
        .put(`/api/groups/${testGroupId}`)
        .set('Authorization', 'Bearer invalid_token')
        .send(updateData)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Authorization', () => {
    let testGroupId: string;

    beforeEach(async () => {
      // Create a test group owned by user 1
      const { data: group, error } = await supabase
        .from('groups')
        .insert({
          name: 'Test Group',
          description: 'Test description',
          category: 'sports',
          created_by: testUserId
        })
        .select()
        .single();

      if (error) throw error;
      testGroupId = group.id;
      testGroupIds.push(testGroupId);

      // Create membership for creator
      await supabase
        .from('memberships')
        .insert({
          user_id: testUserId,
          group_id: testGroupId,
          role: 'creator',
          status: 'active'
        });
    });

    it('should return 404 when group does not exist', async () => {
      const fakeGroupId = '12345678-1234-1234-1234-123456789012';
      const updateData = {
        name: 'Updated Group Name'
      };

      const response = await request(app)
        .put(`/api/groups/${fakeGroupId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('not found');
    });

    it('should return 403 when user is not group admin or creator', async () => {
      const updateData = {
        name: 'Updated Group Name'
      };

      const response = await request(app)
        .put(`/api/groups/${testGroupId}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send(updateData)
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('permission');
    });

    it('should allow group creator to update', async () => {
      const updateData = {
        name: 'Updated by Creator'
      };

      const response = await request(app)
        .put(`/api/groups/${testGroupId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.name).toBe(updateData.name);
    });

    it('should allow group admin to update', async () => {
      // Add user 2 as admin
      await supabase
        .from('memberships')
        .insert({
          user_id: testUser2Id,
          group_id: testGroupId,
          role: 'admin',
          status: 'active'
        });

      const updateData = {
        name: 'Updated by Admin'
      };

      const response = await request(app)
        .put(`/api/groups/${testGroupId}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.name).toBe(updateData.name);
    });

    it('should not allow regular member to update', async () => {
      // Add user 2 as regular member
      await supabase
        .from('memberships')
        .insert({
          user_id: testUser2Id,
          group_id: testGroupId,
          role: 'member',
          status: 'active'
        });

      const updateData = {
        name: 'Updated by Member'
      };

      const response = await request(app)
        .put(`/api/groups/${testGroupId}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send(updateData)
        .expect(403);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Input validation', () => {
    let testGroupId: string;

    beforeEach(async () => {
      // Create a test group
      const { data: group, error } = await supabase
        .from('groups')
        .insert({
          name: 'Test Group',
          description: 'Test description',
          category: 'sports',
          created_by: testUserId
        })
        .select()
        .single();

      if (error) throw error;
      testGroupId = group.id;
      testGroupIds.push(testGroupId);

      // Create membership for creator
      await supabase
        .from('memberships')
        .insert({
          user_id: testUserId,
          group_id: testGroupId,
          role: 'creator',
          status: 'active'
        });
    });

    it('should return 400 when name is too short', async () => {
      const updateData = {
        name: 'AB'
      };

      const response = await request(app)
        .put(`/api/groups/${testGroupId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('name');
      expect(response.body.error).toContain('3');
    });

    it('should return 400 when name is too long', async () => {
      const updateData = {
        name: 'A'.repeat(101)
      };

      const response = await request(app)
        .put(`/api/groups/${testGroupId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('name');
      expect(response.body.error).toContain('100');
    });

    it('should return 400 when description is too long', async () => {
      const updateData = {
        description: 'A'.repeat(501)
      };

      const response = await request(app)
        .put(`/api/groups/${testGroupId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('description');
      expect(response.body.error).toContain('500');
    });

    it('should return 400 when category is invalid', async () => {
      const updateData = {
        category: 'invalid_category'
      };

      const response = await request(app)
        .put(`/api/groups/${testGroupId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('category');
    });

    it('should return 400 when visibility is invalid', async () => {
      const updateData = {
        visibility: 'invalid_visibility'
      };

      const response = await request(app)
        .put(`/api/groups/${testGroupId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('visibility');
    });

    it('should return 400 when max_members is invalid', async () => {
      const updateData = {
        max_members: 501
      };

      const response = await request(app)
        .put(`/api/groups/${testGroupId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('max_members');
      expect(response.body.error).toContain('500');
    });
  });

  describe('Successful updates', () => {
    let testGroupId: string;

    beforeEach(async () => {
      // Create a test group
      const { data: group, error } = await supabase
        .from('groups')
        .insert({
          name: 'Original Group Name',
          description: 'Original description',
          category: 'sports',
          visibility: 'public',
          join_policy: 'open',
          max_members: 500,
          location_city: 'São Paulo',
          location_state: 'SP',
          created_by: testUserId
        })
        .select()
        .single();

      if (error) throw error;
      testGroupId = group.id;
      testGroupIds.push(testGroupId);

      // Create membership for creator
      await supabase
        .from('memberships')
        .insert({
          user_id: testUserId,
          group_id: testGroupId,
          role: 'creator',
          status: 'active'
        });
    });

    it('should update name only', async () => {
      const updateData = {
        name: 'Novo Nome do Grupo'
      };

      const response = await request(app)
        .put(`/api/groups/${testGroupId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      const group = response.body.data;
      expect(group.name).toBe(updateData.name);
      expect(group.description).toBe('Original description'); // unchanged
      expect(group.category).toBe('sports'); // unchanged
    });

    it('should update description only', async () => {
      const updateData = {
        description: 'Nova descrição do grupo com acentuação'
      };

      const response = await request(app)
        .put(`/api/groups/${testGroupId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      const group = response.body.data;
      expect(group.description).toBe(updateData.description);
      expect(group.name).toBe('Original Group Name'); // unchanged
    });

    it('should update multiple fields at once', async () => {
      const updateData = {
        name: 'Grupo Atualizado',
        description: 'Descrição atualizada',
        category: 'culture',
        visibility: 'private',
        join_policy: 'approval',
        max_members: 100,
        location_city: 'Rio de Janeiro',
        location_state: 'RJ'
      };

      const response = await request(app)
        .put(`/api/groups/${testGroupId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      const group = response.body.data;
      expect(group.name).toBe(updateData.name);
      expect(group.description).toBe(updateData.description);
      expect(group.category).toBe(updateData.category);
      expect(group.visibility).toBe(updateData.visibility);
      expect(group.join_policy).toBe(updateData.join_policy);
      expect(group.max_members).toBe(updateData.max_members);
      expect(group.location_city).toBe(updateData.location_city);
      expect(group.location_state).toBe(updateData.location_state);
    });

    it('should clear location fields when set to null', async () => {
      const updateData = {
        location_city: null,
        location_state: null
      };

      const response = await request(app)
        .put(`/api/groups/${testGroupId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      const group = response.body.data;
      expect(group.location_city).toBeNull();
      expect(group.location_state).toBeNull();
    });

    it('should update updated_at timestamp', async () => {
      // Get original timestamp
      const { data: originalGroup, error: fetchError } = await supabase
        .from('groups')
        .select('updated_at')
        .eq('id', testGroupId)
        .single();

      if (fetchError) throw fetchError;

      // Wait a moment to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updateData = {
        name: 'Updated Name'
      };

      const response = await request(app)
        .put(`/api/groups/${testGroupId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      const updatedTimestamp = new Date(response.body.data.updated_at);
      const originalTimestamp = new Date(originalGroup.updated_at);

      expect(updatedTimestamp).toEqual(expect.any(Date));
      expect(updatedTimestamp.getTime()).toBeGreaterThan(originalTimestamp.getTime());
    });

    it('should preserve unchanged fields', async () => {
      const updateData = {
        name: 'Only Name Changed'
      };

      const response = await request(app)
        .put(`/api/groups/${testGroupId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      const group = response.body.data;

      // Changed field
      expect(group.name).toBe(updateData.name);

      // Unchanged fields
      expect(group.description).toBe('Original description');
      expect(group.category).toBe('sports');
      expect(group.visibility).toBe('public');
      expect(group.join_policy).toBe('open');
      expect(group.max_members).toBe(500);
      expect(group.location_city).toBe('São Paulo');
      expect(group.location_state).toBe('SP');
      expect(group.created_by).toBe(testUserId);
      expect(group.member_count).toBeDefined(); // Should not change
    });
  });

  describe('Business logic', () => {
    let testGroupId: string;

    beforeEach(async () => {
      // Create a test group
      const { data: group, error } = await supabase
        .from('groups')
        .insert({
          name: 'Test Group',
          description: 'Test description',
          category: 'sports',
          created_by: testUserId
        })
        .select()
        .single();

      if (error) throw error;
      testGroupId = group.id;
      testGroupIds.push(testGroupId);

      // Create membership for creator
      await supabase
        .from('memberships')
        .insert({
          user_id: testUserId,
          group_id: testGroupId,
          role: 'creator',
          status: 'active'
        });
    });

    it('should not allow changing created_by field', async () => {
      const updateData = {
        name: 'Updated Name',
        created_by: testUser2Id // Should be ignored
      };

      const response = await request(app)
        .put(`/api/groups/${testGroupId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.created_by).toBe(testUserId); // Should remain original
    });

    it('should not allow changing id field', async () => {
      const fakeId = '12345678-1234-1234-1234-123456789012';
      const updateData = {
        name: 'Updated Name',
        id: fakeId // Should be ignored
      };

      const response = await request(app)
        .put(`/api/groups/${testGroupId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.id).toBe(testGroupId); // Should remain original
    });

    it('should not allow changing member_count directly', async () => {
      const updateData = {
        name: 'Updated Name',
        member_count: 999 // Should be ignored
      };

      const response = await request(app)
        .put(`/api/groups/${testGroupId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      // member_count should remain as managed by triggers
      expect(response.body.data.member_count).not.toBe(999);
    });

    it('should handle empty request body', async () => {
      const response = await request(app)
        .put(`/api/groups/${testGroupId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(200);

      // Should return the group unchanged
      expect(response.body.data.name).toBe('Test Group');
    });
  });

  describe('Edge cases', () => {
    let testGroupId: string;

    beforeEach(async () => {
      // Create a test group
      const { data: group, error } = await supabase
        .from('groups')
        .insert({
          name: 'Test Group',
          description: 'Test description',
          category: 'sports',
          created_by: testUserId
        })
        .select()
        .single();

      if (error) throw error;
      testGroupId = group.id;
      testGroupIds.push(testGroupId);

      // Create membership for creator
      await supabase
        .from('memberships')
        .insert({
          user_id: testUserId,
          group_id: testGroupId,
          role: 'creator',
          status: 'active'
        });
    });

    it('should handle special characters in name', async () => {
      const updateData = {
        name: 'Grupo "Especial" & Único - São Paulo!'
      };

      const response = await request(app)
        .put(`/api/groups/${testGroupId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.name).toBe(updateData.name);
    });

    it('should handle setting description to null', async () => {
      const updateData = {
        description: null
      };

      const response = await request(app)
        .put(`/api/groups/${testGroupId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.description).toBeNull();
    });

    it('should handle setting description to empty string', async () => {
      const updateData = {
        description: ''
      };

      const response = await request(app)
        .put(`/api/groups/${testGroupId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.description).toBe('');
    });
  });
});