# Groups API Contract

## Base URL
`/api/v1/groups`

## Authentication
All endpoints require Clerk JWT authentication via `Authorization: Bearer <token>` header.

## Endpoints

### GET /groups
List groups accessible to the user.

**Query Parameters:**
- `visibility` (optional): `public` | `private` | `all` (default: `all`)
- `category` (optional): Filter by category
- `location_city` (optional): Filter by city
- `search` (optional): Search in name and description
- `limit` (optional): Page size (default: 20, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response 200:**
```json
{
  "groups": [
    {
      "id": "uuid",
      "name": "Grupo de Corrida SP",
      "description": "Grupo para corredores de São Paulo",
      "category": "sports",
      "visibility": "public",
      "member_count": 45,
      "cover_image_url": "https://...",
      "avatar_url": "https://...",
      "location_city": "São Paulo",
      "location_state": "SP",
      "created_at": "2025-01-15T10:00:00Z",
      "created_by": {
        "id": "uuid",
        "display_name": "Maria Silva",
        "avatar_url": "https://..."
      },
      "user_membership": {
        "role": "member",
        "status": "active",
        "joined_at": "2025-01-16T14:30:00Z"
      }
    }
  ],
  "total": 150,
  "has_more": true
}
```

### POST /groups
Create a new group.

**Request Body:**
```json
{
  "name": "Grupo de Culinária",
  "description": "Explorando a gastronomia brasileira",
  "category": "food",
  "visibility": "public",
  "join_policy": "open",
  "max_members": 100,
  "location_city": "Rio de Janeiro",
  "location_state": "RJ",
  "cover_image_url": "https://...",
  "avatar_url": "https://..."
}
```

**Response 201:**
```json
{
  "group": {
    "id": "uuid",
    "name": "Grupo de Culinária",
    "description": "Explorando a gastronomia brasileira",
    "category": "food",
    "visibility": "public",
    "join_policy": "open",
    "max_members": 100,
    "member_count": 1,
    "location_city": "Rio de Janeiro",
    "location_state": "RJ",
    "cover_image_url": "https://...",
    "avatar_url": "https://...",
    "created_at": "2025-01-17T09:15:00Z",
    "created_by": {
      "id": "uuid",
      "display_name": "João Santos",
      "avatar_url": "https://..."
    },
    "user_membership": {
      "role": "creator",
      "status": "active",
      "joined_at": "2025-01-17T09:15:00Z"
    }
  }
}
```

### GET /groups/{id}
Get detailed information about a specific group.

**Response 200:**
```json
{
  "group": {
    "id": "uuid",
    "name": "Grupo de Corrida SP",
    "description": "Grupo para corredores de São Paulo",
    "category": "sports",
    "visibility": "public",
    "join_policy": "open",
    "max_members": 500,
    "member_count": 45,
    "event_count": 12,
    "cover_image_url": "https://...",
    "avatar_url": "https://...",
    "location_city": "São Paulo",
    "location_state": "SP",
    "created_at": "2025-01-15T10:00:00Z",
    "updated_at": "2025-01-16T15:30:00Z",
    "created_by": {
      "id": "uuid",
      "display_name": "Maria Silva",
      "avatar_url": "https://..."
    },
    "user_membership": {
      "role": "member",
      "status": "active",
      "joined_at": "2025-01-16T14:30:00Z",
      "notifications_enabled": true
    },
    "recent_events": [
      {
        "id": "uuid",
        "title": "Corrida no Ibirapuera",
        "starts_at": "2025-01-20T07:00:00Z",
        "location_name": "Parque Ibirapuera",
        "current_attendees": 8
      }
    ]
  }
}
```

### PUT /groups/{id}
Update group information (requires admin+ role).

**Request Body:**
```json
{
  "name": "Grupo de Corrida São Paulo",
  "description": "Grupo para corredores e caminhantes de São Paulo",
  "visibility": "public",
  "join_policy": "approval",
  "max_members": 200,
  "location_city": "São Paulo",
  "location_state": "SP",
  "cover_image_url": "https://...",
  "avatar_url": "https://..."
}
```

**Response 200:** Same as GET /groups/{id}

### DELETE /groups/{id}
Delete a group (requires creator role).

**Response 204:** No content

## Members Management

### GET /groups/{id}/members
List group members.

**Query Parameters:**
- `role` (optional): Filter by role (`creator`, `admin`, `member`)
- `status` (optional): Filter by status (`active`, `pending`, `banned`)
- `limit` (optional): Page size (default: 50, max: 100)
- `offset` (optional): Pagination offset

**Response 200:**
```json
{
  "members": [
    {
      "id": "uuid",
      "user": {
        "id": "uuid",
        "display_name": "Maria Silva",
        "avatar_url": "https://...",
        "location_city": "São Paulo"
      },
      "role": "creator",
      "status": "active",
      "joined_at": "2025-01-15T10:00:00Z",
      "notifications_enabled": true
    }
  ],
  "total": 45,
  "has_more": false
}
```

### POST /groups/{id}/members
Add a member to the group (invite or direct add for admins).

**Request Body:**
```json
{
  "user_id": "uuid",
  "role": "member",
  "send_notification": true
}
```

**Response 201:**
```json
{
  "membership": {
    "id": "uuid",
    "user": {
      "id": "uuid",
      "display_name": "Carlos Santos",
      "avatar_url": "https://..."
    },
    "role": "member",
    "status": "active",
    "joined_at": "2025-01-17T11:30:00Z",
    "notifications_enabled": true
  }
}
```

### PUT /groups/{id}/members/{member_id}
Update member role or settings (requires admin+ role).

**Request Body:**
```json
{
  "role": "admin",
  "notifications_enabled": false
}
```

**Response 200:** Same as POST /groups/{id}/members

### DELETE /groups/{id}/members/{member_id}
Remove member from group (admin+ role or self).

**Response 204:** No content

## Join Requests

### POST /groups/{id}/join
Request to join a group.

**Response 201:**
```json
{
  "membership": {
    "id": "uuid",
    "status": "active",
    "role": "member",
    "joined_at": "2025-01-17T12:00:00Z"
  }
}
```

### POST /groups/{id}/leave
Leave a group.

**Response 204:** No content

## Error Responses

### 400 Bad Request
```json
{
  "error": "validation_error",
  "message": "Nome do grupo deve ter entre 3 e 100 caracteres",
  "details": {
    "field": "name",
    "code": "invalid_length"
  }
}
```

### 403 Forbidden
```json
{
  "error": "insufficient_permissions",
  "message": "Você não tem permissão para realizar esta ação",
  "required_role": "admin"
}
```

### 404 Not Found
```json
{
  "error": "group_not_found",
  "message": "Grupo não encontrado ou você não tem acesso"
}
```

### 409 Conflict
```json
{
  "error": "membership_exists",
  "message": "Usuário já é membro deste grupo"
}
```

## Rate Limits
- Group creation: 5 per hour per user
- Join requests: 20 per hour per user
- Member management: 100 per hour per user
- General reads: 1000 per hour per user