# Users API Contract

## Base URL
`/api/v1/users`

## Authentication
All endpoints require Clerk JWT authentication via `Authorization: Bearer <token>` header.

## Endpoints

### GET /users/me
Get current user's profile.

**Response 200:**
```json
{
  "user": {
    "id": "uuid",
    "display_name": "Maria Silva",
    "bio": "Apaixonada por corrida e fotografia",
    "avatar_url": "https://...",
    "location_city": "São Paulo",
    "location_state": "SP",
    "notification_preferences": {
      "push_enabled": true,
      "email_enabled": true,
      "event_reminders": true,
      "rsvp_updates": true,
      "group_invitations": true
    },
    "privacy_settings": {
      "profile_visible": true,
      "location_visible": false,
      "email_visible": false
    },
    "language": "pt-BR",
    "timezone": "America/Sao_Paulo",
    "created_at": "2025-01-10T08:30:00Z",
    "updated_at": "2025-01-16T14:20:00Z",
    "stats": {
      "groups_count": 5,
      "events_attended": 12,
      "events_created": 3
    }
  }
}
```

### PUT /users/me
Update current user's profile.

**Request Body:**
```json
{
  "display_name": "Maria Silva Santos",
  "bio": "Corredora amadora e organizadora de eventos esportivos",
  "location_city": "São Paulo",
  "location_state": "SP",
  "notification_preferences": {
    "push_enabled": true,
    "email_enabled": false,
    "event_reminders": true,
    "rsvp_updates": true,
    "group_invitations": true
  },
  "privacy_settings": {
    "profile_visible": true,
    "location_visible": true,
    "email_visible": false
  },
  "language": "pt-BR",
  "timezone": "America/Sao_Paulo"
}
```

**Response 200:** Same as GET /users/me

### GET /users/{id}
Get public profile of another user.

**Response 200:**
```json
{
  "user": {
    "id": "uuid",
    "display_name": "João Santos",
    "bio": "Fotógrafo e entusiasta da culinária brasileira",
    "avatar_url": "https://...",
    "location_city": "Rio de Janeiro",
    "location_state": "RJ",
    "created_at": "2025-01-05T12:15:00Z",
    "stats": {
      "groups_count": 3,
      "events_created": 8
    },
    "mutual_groups": [
      {
        "id": "uuid",
        "name": "Fotógrafos do Brasil",
        "avatar_url": "https://..."
      }
    ]
  }
}
```

## User Groups

### GET /users/me/groups
Get current user's groups.

**Query Parameters:**
- `role` (optional): Filter by user's role (`creator`, `admin`, `member`)
- `status` (optional): Filter by membership status (`active`, `pending`)
- `limit` (optional): Page size (default: 20, max: 100)
- `offset` (optional): Pagination offset

**Response 200:**
```json
{
  "groups": [
    {
      "id": "uuid",
      "name": "Grupo de Corrida SP",
      "description": "Grupo para corredores de São Paulo",
      "category": "sports",
      "avatar_url": "https://...",
      "member_count": 45,
      "location_city": "São Paulo",
      "membership": {
        "role": "admin",
        "status": "active",
        "joined_at": "2025-01-10T10:00:00Z",
        "notifications_enabled": true
      },
      "recent_activity": {
        "last_event": "2025-01-16T10:00:00Z",
        "unread_notifications": 2
      }
    }
  ],
  "total": 5,
  "has_more": false
}
```

## User Events

### GET /users/me/events
Get current user's events (from their groups).

**Query Parameters:**
- `rsvp_status` (optional): Filter by user's RSVP (`going`, `not_going`, `maybe`, `no_response`)
- `time_filter` (optional): `upcoming` | `past` | `today` | `this_week` | `all` (default: `upcoming`)
- `group_id` (optional): Filter by specific group
- `limit` (optional): Page size (default: 20, max: 100)
- `offset` (optional): Pagination offset

**Response 200:** Same format as Events API

### GET /users/me/events/created
Get events created by current user.

**Query Parameters:** Same as above (excluding `rsvp_status`)

**Response 200:** Same format as Events API

## Notifications

### GET /users/me/notifications
Get current user's notifications.

**Query Parameters:**
- `read` (optional): Filter by read status (`true`, `false`, `all`) (default: `all`)
- `type` (optional): Filter by notification type
- `limit` (optional): Page size (default: 50, max: 100)
- `offset` (optional): Pagination offset

**Response 200:**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "event_created",
      "title": "Novo evento: Workshop de Fotografia",
      "body": "João Santos criou um novo evento no grupo Fotógrafos de SP",
      "read_at": null,
      "created_at": "2025-01-17T10:30:00Z",
      "group": {
        "id": "uuid",
        "name": "Fotógrafos de SP",
        "avatar_url": "https://..."
      },
      "event": {
        "id": "uuid",
        "title": "Workshop de Fotografia",
        "starts_at": "2025-01-25T14:00:00Z"
      },
      "related_user": {
        "id": "uuid",
        "display_name": "João Santos",
        "avatar_url": "https://..."
      }
    }
  ],
  "unread_count": 5,
  "total": 25,
  "has_more": true
}
```

### PUT /users/me/notifications/{id}/read
Mark a notification as read.

**Response 200:**
```json
{
  "notification": {
    "id": "uuid",
    "read_at": "2025-01-17T15:30:00Z"
  }
}
```

### PUT /users/me/notifications/read-all
Mark all notifications as read.

**Response 200:**
```json
{
  "updated_count": 5
}
```

## Search

### GET /users/search
Search for users (public profiles only).

**Query Parameters:**
- `q`: Search query (name, bio)
- `location_city` (optional): Filter by city
- `limit` (optional): Page size (default: 20, max: 50)
- `offset` (optional): Pagination offset

**Response 200:**
```json
{
  "users": [
    {
      "id": "uuid",
      "display_name": "Ana Costa",
      "bio": "Runner and yoga instructor",
      "avatar_url": "https://...",
      "location_city": "São Paulo",
      "mutual_groups": [
        {
          "id": "uuid",
          "name": "Yoga SP",
          "avatar_url": "https://..."
        }
      ]
    }
  ],
  "total": 15,
  "has_more": true
}
```

## Account Management

### POST /users/me/avatar
Upload user avatar image.

**Request:** Multipart form with image file

**Response 200:**
```json
{
  "avatar_url": "https://storage.googleapis.com/grupito/avatars/uuid.jpg"
}
```

### DELETE /users/me/avatar
Remove user avatar.

**Response 204:** No content

### DELETE /users/me
Delete user account (soft delete with 30-day recovery).

**Response 204:** No content

### POST /users/me/export
Request data export (LGPD compliance).

**Response 202:**
```json
{
  "export_id": "uuid",
  "status": "processing",
  "estimated_completion": "2025-01-17T16:00:00Z"
}
```

### GET /users/me/exports/{export_id}
Check export status or download.

**Response 200:**
```json
{
  "export_id": "uuid",
  "status": "completed",
  "download_url": "https://...",
  "expires_at": "2025-01-24T16:00:00Z",
  "file_size": 1024000
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "validation_error",
  "message": "Nome deve ter entre 2 e 50 caracteres",
  "details": {
    "field": "display_name",
    "code": "invalid_length"
  }
}
```

### 403 Forbidden
```json
{
  "error": "profile_private",
  "message": "Este perfil é privado"
}
```

### 404 Not Found
```json
{
  "error": "user_not_found",
  "message": "Usuário não encontrado"
}
```

### 413 Payload Too Large
```json
{
  "error": "file_too_large",
  "message": "Imagem deve ter no máximo 5MB",
  "max_size": 5242880
}
```

### 422 Unprocessable Entity
```json
{
  "error": "invalid_file_type",
  "message": "Apenas imagens JPG, PNG e WebP são aceitas",
  "accepted_types": ["image/jpeg", "image/png", "image/webp"]
}
```

## Real-time Updates

### WebSocket Events
User-specific events are pushed via Supabase Realtime:

**New Notification:**
```json
{
  "type": "notification_created",
  "notification": { /* notification object */ }
}
```

**Profile Updated:**
```json
{
  "type": "profile_updated",
  "user_id": "uuid",
  "updated_fields": ["display_name", "avatar_url"]
}
```

## Rate Limits
- Profile updates: 10 per hour per user
- Avatar uploads: 5 per hour per user
- Search requests: 100 per hour per user
- General reads: 1000 per hour per user
- Export requests: 1 per day per user