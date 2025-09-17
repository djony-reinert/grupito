import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { createSupabaseServiceClient } from '../../src/lib/supabase';
import app from '../../src/app';

describe('Groups API - GET /groups', () => {
  let supabase: any;
  let testUserId: string;
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
      const response = await request(app)
        .get('/api/groups')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('authorization');
    });

    it('should return 401 with invalid JWT token', async () => {
      const response = await request(app)
        .get('/api/groups')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Valid requests', () => {
    let authToken: string;

    beforeEach(async () => {
      // Get valid auth token for test user
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'test123456'
      });

      if (error) throw error;
      authToken = data.session.access_token;
    });

    it('should return empty array when no groups exist', async () => {
      const response = await request(app)
        .get('/api/groups')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data).toHaveLength(0);
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 20,
        total: 0,
        hasNext: false
      });
    });

    it('should return public groups with correct structure', async () => {
      // Create test groups
      const { data: group1, error: error1 } = await supabase
        .from('groups')
        .insert({
          name: 'Grupo de Corrida SP',
          description: 'Grupo para corredores de São Paulo',
          category: 'sports',
          visibility: 'public',
          created_by: testUserId,
          location_city: 'São Paulo',
          location_state: 'SP'
        })
        .select()
        .single();

      if (error1) throw error1;
      testGroupIds.push(group1.id);

      const { data: group2, error: error2 } = await supabase
        .from('groups')
        .insert({
          name: 'Fotógrafos do Rio',
          description: 'Comunidade de fotógrafos',
          category: 'photography',
          visibility: 'public',
          created_by: testUserId,
          location_city: 'Rio de Janeiro',
          location_state: 'RJ'
        })
        .select()
        .single();

      if (error2) throw error2;
      testGroupIds.push(group2.id);

      const response = await request(app)
        .get('/api/groups')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data).toHaveLength(2);

      // Validate group structure
      const group = response.body.data[0];
      expect(group).toHaveProperty('id');
      expect(group).toHaveProperty('name');
      expect(group).toHaveProperty('description');
      expect(group).toHaveProperty('category');
      expect(group).toHaveProperty('visibility', 'public');
      expect(group).toHaveProperty('location_city');
      expect(group).toHaveProperty('location_state');
      expect(group).toHaveProperty('member_count');
      expect(group).toHaveProperty('created_at');
      expect(group).toHaveProperty('created_by');

      // Should not expose sensitive fields
      expect(group).not.toHaveProperty('join_policy');
      expect(group).not.toHaveProperty('max_members');
    });

    it('should filter by category when provided', async () => {
      // Create groups with different categories
      const { data: sportsGroup, error: error1 } = await supabase
        .from('groups')
        .insert({
          name: 'Grupo de Futebol',
          description: 'Futebol aos domingos',
          category: 'sports',
          visibility: 'public',
          created_by: testUserId
        })
        .select()
        .single();

      if (error1) throw error1;
      testGroupIds.push(sportsGroup.id);

      const { data: techGroup, error: error2 } = await supabase
        .from('groups')
        .insert({
          name: 'Desenvolvedores JavaScript',
          description: 'Comunidade de devs JS',
          category: 'tech',
          visibility: 'public',
          created_by: testUserId
        })
        .select()
        .single();

      if (error2) throw error2;
      testGroupIds.push(techGroup.id);

      const response = await request(app)
        .get('/api/groups?category=sports')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].category).toBe('sports');
      expect(response.body.data[0].name).toBe('Grupo de Futebol');
    });

    it('should filter by location when provided', async () => {
      // Create groups in different cities
      const { data: spGroup, error: error1 } = await supabase
        .from('groups')
        .insert({
          name: 'Grupo SP',
          description: 'Grupo de São Paulo',
          category: 'other',
          visibility: 'public',
          created_by: testUserId,
          location_city: 'São Paulo',
          location_state: 'SP'
        })
        .select()
        .single();

      if (error1) throw error1;
      testGroupIds.push(spGroup.id);

      const { data: rjGroup, error: error2 } = await supabase
        .from('groups')
        .insert({
          name: 'Grupo RJ',
          description: 'Grupo do Rio',
          category: 'other',
          visibility: 'public',
          created_by: testUserId,
          location_city: 'Rio de Janeiro',
          location_state: 'RJ'
        })
        .select()
        .single();

      if (error2) throw error2;
      testGroupIds.push(rjGroup.id);

      const response = await request(app)
        .get('/api/groups?city=São Paulo')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].location_city).toBe('São Paulo');
      expect(response.body.data[0].name).toBe('Grupo SP');
    });

    it('should support pagination', async () => {
      // Create multiple groups for pagination test
      const groupPromises = Array.from({ length: 25 }, (_, i) =>
        supabase
          .from('groups')
          .insert({
            name: `Grupo ${i + 1}`,
            description: `Descrição do grupo ${i + 1}`,
            category: 'other',
            visibility: 'public',
            created_by: testUserId
          })
          .select()
          .single()
      );

      const results = await Promise.all(groupPromises);
      testGroupIds.push(...results.map(r => r.data.id));

      // Test first page
      const page1Response = await request(app)
        .get('/api/groups?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(page1Response.body.data).toHaveLength(10);
      expect(page1Response.body.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 25,
        hasNext: true
      });

      // Test second page
      const page2Response = await request(app)
        .get('/api/groups?page=2&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(page2Response.body.data).toHaveLength(10);
      expect(page2Response.body.pagination).toMatchObject({
        page: 2,
        limit: 10,
        total: 25,
        hasNext: true
      });

      // Test last page
      const page3Response = await request(app)
        .get('/api/groups?page=3&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(page3Response.body.data).toHaveLength(5);
      expect(page3Response.body.pagination).toMatchObject({
        page: 3,
        limit: 10,
        total: 25,
        hasNext: false
      });
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/groups?page=0&limit=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('pagination');
    });

    it('should not return private groups user is not member of', async () => {
      // Create private group
      const { data: privateGroup, error } = await supabase
        .from('groups')
        .insert({
          name: 'Grupo Privado',
          description: 'Grupo privado de teste',
          category: 'other',
          visibility: 'private',
          created_by: testUserId
        })
        .select()
        .single();

      if (error) throw error;
      testGroupIds.push(privateGroup.id);

      // Create another user to test access
      const { data: user2, error: userError } = await supabase.auth.admin.createUser({
        email: 'test2@example.com',
        password: 'test123456',
        email_confirm: true
      });

      if (userError) throw userError;

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user2.user.id,
          display_name: 'Test User 2'
        });

      if (profileError) throw profileError;

      // Get auth token for second user
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'test2@example.com',
        password: 'test123456'
      });

      if (signInError) throw signInError;

      const response = await request(app)
        .get('/api/groups')
        .set('Authorization', `Bearer ${signInData.session.access_token}`)
        .expect(200);

      // Should not include private group
      expect(response.body.data).toHaveLength(0);

      // Cleanup second user
      await supabase.from('profiles').delete().eq('id', user2.user.id);
      await supabase.auth.admin.deleteUser(user2.user.id);
    });
  });
});