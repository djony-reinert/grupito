import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { createSupabaseServiceClient } from '../../src/lib/supabase';
import app from '../../src/app';

describe('Groups API - POST /groups', () => {
  let supabase: any;
  let testUserId: string;
  let authToken: string;
  let testGroupIds: string[] = [];

  beforeAll(async () => {
    supabase = createSupabaseServiceClient();

    // Create test user for authentication
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
      email: 'test@example.com',
      password: 'test123456',
      email_confirm: true
    });

    if (userError) throw userError;
    testUserId = user.user.id;

    // Create test profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: testUserId,
        display_name: 'Test User',
        bio: 'Test bio',
        location_city: 'São Paulo',
        location_state: 'SP'
      });

    if (profileError) throw profileError;

    // Get auth token
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'test123456'
    });

    if (signInError) throw signInError;
    authToken = signInData.session.access_token;
  });

  afterAll(async () => {
    // Clean up test data
    if (testGroupIds.length > 0) {
      await supabase
        .from('groups')
        .delete()
        .in('id', testGroupIds);
    }

    await supabase
      .from('profiles')
      .delete()
      .eq('id', testUserId);

    await supabase.auth.admin.deleteUser(testUserId);
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
    it('should return 401 when no authorization header provided', async () => {
      const groupData = {
        name: 'Test Group',
        description: 'Test description',
        category: 'sports'
      };

      const response = await request(app)
        .post('/api/groups')
        .send(groupData)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('authorization');
    });

    it('should return 401 with invalid JWT token', async () => {
      const groupData = {
        name: 'Test Group',
        description: 'Test description',
        category: 'sports'
      };

      const response = await request(app)
        .post('/api/groups')
        .set('Authorization', 'Bearer invalid_token')
        .send(groupData)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Input validation', () => {
    it('should return 400 when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('name');
    });

    it('should return 400 when name is too short', async () => {
      const groupData = {
        name: 'AB',
        description: 'Test description',
        category: 'sports'
      };

      const response = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${authToken}`)
        .send(groupData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('name');
      expect(response.body.error).toContain('3');
    });

    it('should return 400 when name is too long', async () => {
      const groupData = {
        name: 'A'.repeat(101),
        description: 'Test description',
        category: 'sports'
      };

      const response = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${authToken}`)
        .send(groupData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('name');
      expect(response.body.error).toContain('100');
    });

    it('should return 400 when description is too long', async () => {
      const groupData = {
        name: 'Valid Group Name',
        description: 'A'.repeat(501),
        category: 'sports'
      };

      const response = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${authToken}`)
        .send(groupData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('description');
      expect(response.body.error).toContain('500');
    });

    it('should return 400 when category is invalid', async () => {
      const groupData = {
        name: 'Test Group',
        description: 'Test description',
        category: 'invalid_category'
      };

      const response = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${authToken}`)
        .send(groupData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('category');
    });

    it('should return 400 when visibility is invalid', async () => {
      const groupData = {
        name: 'Test Group',
        description: 'Test description',
        category: 'sports',
        visibility: 'invalid_visibility'
      };

      const response = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${authToken}`)
        .send(groupData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('visibility');
    });

    it('should return 400 when max_members is invalid', async () => {
      const groupData = {
        name: 'Test Group',
        description: 'Test description',
        category: 'sports',
        max_members: 501
      };

      const response = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${authToken}`)
        .send(groupData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('max_members');
      expect(response.body.error).toContain('500');
    });
  });

  describe('Successful group creation', () => {
    it('should create a public group with minimal required fields', async () => {
      const groupData = {
        name: 'Grupo de Corrida Matinal',
        description: 'Grupo para corredores que gostam de exercitar-se pela manhã',
        category: 'sports'
      };

      const response = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${authToken}`)
        .send(groupData)
        .expect(201);

      expect(response.body).toHaveProperty('data');
      const group = response.body.data;

      // Validate response structure
      expect(group).toHaveProperty('id');
      expect(group).toHaveProperty('name', groupData.name);
      expect(group).toHaveProperty('description', groupData.description);
      expect(group).toHaveProperty('category', groupData.category);
      expect(group).toHaveProperty('visibility', 'public'); // default
      expect(group).toHaveProperty('join_policy', 'open'); // default
      expect(group).toHaveProperty('max_members', 500); // default
      expect(group).toHaveProperty('member_count', 1); // creator is auto-member
      expect(group).toHaveProperty('created_by', testUserId);
      expect(group).toHaveProperty('created_at');
      expect(group).toHaveProperty('updated_at');

      testGroupIds.push(group.id);

      // Verify group was created in database
      const { data: dbGroup, error } = await supabase
        .from('groups')
        .select('*')
        .eq('id', group.id)
        .single();

      expect(error).toBeNull();
      expect(dbGroup.name).toBe(groupData.name);

      // Verify creator membership was created
      const { data: membership, error: membershipError } = await supabase
        .from('memberships')
        .select('*')
        .eq('group_id', group.id)
        .eq('user_id', testUserId)
        .single();

      expect(membershipError).toBeNull();
      expect(membership.role).toBe('creator');
      expect(membership.status).toBe('active');
    });

    it('should create a group with all optional fields', async () => {
      const groupData = {
        name: 'Fotógrafos Urbanos RJ',
        description: 'Grupo de fotógrafos especializados em fotografia urbana no Rio de Janeiro',
        category: 'photography',
        visibility: 'private',
        join_policy: 'approval',
        max_members: 50,
        location_city: 'Rio de Janeiro',
        location_state: 'RJ'
      };

      const response = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${authToken}`)
        .send(groupData)
        .expect(201);

      const group = response.body.data;

      expect(group).toHaveProperty('name', groupData.name);
      expect(group).toHaveProperty('description', groupData.description);
      expect(group).toHaveProperty('category', groupData.category);
      expect(group).toHaveProperty('visibility', groupData.visibility);
      expect(group).toHaveProperty('join_policy', groupData.join_policy);
      expect(group).toHaveProperty('max_members', groupData.max_members);
      expect(group).toHaveProperty('location_city', groupData.location_city);
      expect(group).toHaveProperty('location_state', groupData.location_state);

      testGroupIds.push(group.id);
    });

    it('should create group with valid categories', async () => {
      const validCategories = [
        'sports', 'food', 'culture', 'tech', 'music', 'books',
        'games', 'travel', 'business', 'outdoor', 'health',
        'education', 'volunteer', 'photography', 'other'
      ];

      for (const category of validCategories) {
        const groupData = {
          name: `Test Group ${category}`,
          description: `Test group for ${category}`,
          category: category
        };

        const response = await request(app)
          .post('/api/groups')
          .set('Authorization', `Bearer ${authToken}`)
          .send(groupData)
          .expect(201);

        expect(response.body.data.category).toBe(category);
        testGroupIds.push(response.body.data.id);
      }
    });

    it('should create group with valid visibility options', async () => {
      const visibilityOptions = ['public', 'private', 'hidden'];

      for (const visibility of visibilityOptions) {
        const groupData = {
          name: `Test Group ${visibility}`,
          description: `Test group with ${visibility} visibility`,
          category: 'other',
          visibility: visibility
        };

        const response = await request(app)
          .post('/api/groups')
          .set('Authorization', `Bearer ${authToken}`)
          .send(groupData)
          .expect(201);

        expect(response.body.data.visibility).toBe(visibility);
        testGroupIds.push(response.body.data.id);
      }
    });

    it('should create group with valid join policies', async () => {
      const joinPolicies = ['open', 'approval', 'invitation'];

      for (const joinPolicy of joinPolicies) {
        const groupData = {
          name: `Test Group ${joinPolicy}`,
          description: `Test group with ${joinPolicy} join policy`,
          category: 'other',
          join_policy: joinPolicy
        };

        const response = await request(app)
          .post('/api/groups')
          .set('Authorization', `Bearer ${authToken}`)
          .send(groupData)
          .expect(201);

        expect(response.body.data.join_policy).toBe(joinPolicy);
        testGroupIds.push(response.body.data.id);
      }
    });

    it('should handle Brazilian location names correctly', async () => {
      const groupData = {
        name: 'Grupo São Paulo',
        description: 'Grupo com acentuação em São Paulo',
        category: 'culture',
        location_city: 'São Paulo',
        location_state: 'SP'
      };

      const response = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${authToken}`)
        .send(groupData)
        .expect(201);

      const group = response.body.data;
      expect(group.name).toBe('Grupo São Paulo');
      expect(group.location_city).toBe('São Paulo');
      expect(group.location_state).toBe('SP');

      testGroupIds.push(group.id);
    });
  });

  describe('Business logic', () => {
    it('should automatically set creator as group member', async () => {
      const groupData = {
        name: 'Test Membership',
        description: 'Test automatic membership creation',
        category: 'other'
      };

      const response = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${authToken}`)
        .send(groupData)
        .expect(201);

      const groupId = response.body.data.id;
      testGroupIds.push(groupId);

      // Verify membership was created
      const { data: membership, error } = await supabase
        .from('memberships')
        .select('*')
        .eq('group_id', groupId)
        .eq('user_id', testUserId)
        .single();

      expect(error).toBeNull();
      expect(membership.role).toBe('creator');
      expect(membership.status).toBe('active');
      expect(membership.joined_at).toBeTruthy();
    });

    it('should initialize member_count to 1', async () => {
      const groupData = {
        name: 'Test Member Count',
        description: 'Test member count initialization',
        category: 'other'
      };

      const response = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${authToken}`)
        .send(groupData)
        .expect(201);

      expect(response.body.data.member_count).toBe(1);
      testGroupIds.push(response.body.data.id);
    });

    it('should prevent duplicate group names for same user', async () => {
      const groupData = {
        name: 'Unique Group Name',
        description: 'First group with this name',
        category: 'other'
      };

      // Create first group
      const response1 = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${authToken}`)
        .send(groupData)
        .expect(201);

      testGroupIds.push(response1.body.data.id);

      // Try to create second group with same name
      const response2 = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${authToken}`)
        .send(groupData)
        .expect(409);

      expect(response2.body).toHaveProperty('error');
      expect(response2.body.error).toContain('name');
      expect(response2.body.error).toContain('already exists');
    });
  });

  describe('Edge cases', () => {
    it('should handle special characters in group name', async () => {
      const groupData = {
        name: 'Grupo "Especial" & Único - São Paulo!',
        description: 'Grupo com caracteres especiais',
        category: 'other'
      };

      const response = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${authToken}`)
        .send(groupData)
        .expect(201);

      expect(response.body.data.name).toBe(groupData.name);
      testGroupIds.push(response.body.data.id);
    });

    it('should handle empty description', async () => {
      const groupData = {
        name: 'Group Without Description',
        description: '',
        category: 'other'
      };

      const response = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${authToken}`)
        .send(groupData)
        .expect(201);

      expect(response.body.data.description).toBe('');
      testGroupIds.push(response.body.data.id);
    });

    it('should handle null description', async () => {
      const groupData = {
        name: 'Group With Null Description',
        description: null,
        category: 'other'
      };

      const response = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${authToken}`)
        .send(groupData)
        .expect(201);

      expect(response.body.data.description).toBeNull();
      testGroupIds.push(response.body.data.id);
    });
  });
});