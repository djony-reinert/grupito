# Events API Contract

## Base URL
`/api/v1/events`

## Authentication
All endpoints require Clerk JWT authentication via `Authorization: Bearer <token>` header.

## Endpoints

### GET /events
List events accessible to the user.

**Query Parameters:**
- `group_id` (optional): Filter by specific group
- `status` (optional): `published` | `cancelled` | `all` (default: `published`)
- `time_filter` (optional): `upcoming` | `past` | `today` | `this_week` | `all` (default: `upcoming`)
- `location_city` (optional): Filter by city
- `search` (optional): Search in title and description
- `limit` (optional): Page size (default: 20, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response 200:**
```json
{
  "events": [
    {
      "id": "uuid",
      "title": "Corrida no Ibirapuera",
      "description": "Corrida matinal de 5km no parque",
      "starts_at": "2025-01-20T10:00:00Z",
      "ends_at": "2025-01-20T11:00:00Z",
      "timezone": "America/Sao_Paulo",
      "location_name": "Parque Ibirapuera",
      "location_address": "Av. Paulista, 1578 - Bela Vista, São Paulo - SP",
      "is_online": false,
      "max_attendees": 50,
      "current_attendees": 12,
      "cover_image_url": "https://...",
      "status": "published",
      "created_at": "2025-01-15T14:30:00Z",
      "group": {
        "id": "uuid",
        "name": "Grupo de Corrida SP",
        "avatar_url": "https://..."
      },
      "created_by": {
        "id": "uuid",
        "display_name": "Maria Silva",
        "avatar_url": "https://..."
      },
      "user_rsvp": {
        "status": "going",
        "guests_count": 1,
        "created_at": "2025-01-16T09:15:00Z"
      }
    }
  ],
  "total": 25,
  "has_more": true
}
```

### POST /events
Create a new event (requires group membership).

**Request Body:**
```json
{
  "group_id": "uuid",
  "title": "Workshop de Fotografia",
  "description": "Aprenda técnicas básicas de fotografia urbana",
  "starts_at": "2025-01-25T14:00:00Z",
  "ends_at": "2025-01-25T17:00:00Z",
  "timezone": "America/Sao_Paulo",
  "location_name": "Centro Cultural",
  "location_address": "Rua Augusta, 123 - Centro, São Paulo - SP",
  "is_online": false,
  "max_attendees": 20,
  "rsvp_deadline": "2025-01-24T23:59:59Z",
  "allow_guests": true,
  "cover_image_url": "https://..."
}
```

**Response 201:**
```json
{
  "event": {
    "id": "uuid",
    "title": "Workshop de Fotografia",
    "description": "Aprenda técnicas básicas de fotografia urbana",
    "starts_at": "2025-01-25T14:00:00Z",
    "ends_at": "2025-01-25T17:00:00Z",
    "timezone": "America/Sao_Paulo",
    "location_name": "Centro Cultural",
    "location_address": "Rua Augusta, 123 - Centro, São Paulo - SP",
    "is_online": false,
    "max_attendees": 20,
    "current_attendees": 0,
    "rsvp_deadline": "2025-01-24T23:59:59Z",
    "allow_guests": true,
    "cover_image_url": "https://...",
    "status": "published",
    "created_at": "2025-01-17T10:30:00Z",
    "group": {
      "id": "uuid",
      "name": "Fotógrafos de SP",
      "avatar_url": "https://..."
    },
    "created_by": {
      "id": "uuid",
      "display_name": "João Santos",
      "avatar_url": "https://..."
    }
  }
}
```

### GET /events/{id}
Get detailed information about a specific event.

**Response 200:**
```json
{
  "event": {
    "id": "uuid",
    "title": "Corrida no Ibirapuera",
    "description": "Corrida matinal de 5km no parque. Encontro no portão principal.",
    "starts_at": "2025-01-20T10:00:00Z",
    "ends_at": "2025-01-20T11:00:00Z",
    "timezone": "America/Sao_Paulo",
    "location_name": "Parque Ibirapuera",
    "location_address": "Av. Paulista, 1578 - Bela Vista, São Paulo - SP",
    "location_coordinates": [-23.587416, -46.657634],
    "is_online": false,
    "max_attendees": 50,
    "current_attendees": 12,
    "rsvp_deadline": "2025-01-19T23:59:59Z",
    "allow_guests": false,
    "cover_image_url": "https://...",
    "status": "published",
    "created_at": "2025-01-15T14:30:00Z",
    "updated_at": "2025-01-16T08:20:00Z",
    "group": {
      "id": "uuid",
      "name": "Grupo de Corrida SP",
      "avatar_url": "https://...",
      "member_count": 45
    },
    "created_by": {
      "id": "uuid",
      "display_name": "Maria Silva",
      "avatar_url": "https://...",
      "bio": "Corredora há 5 anos"
    },
    "user_rsvp": {
      "status": "going",
      "guests_count": 1,
      "note": "Vou levar minha irmã!",
      "created_at": "2025-01-16T09:15:00Z"
    },
    "rsvp_summary": {
      "going": 12,
      "not_going": 3,
      "maybe": 2
    }
  }
}
```

### PUT /events/{id}
Update event information (requires event creator or group admin role).

**Request Body:**
```json
{
  "title": "Corrida no Ibirapuera - ADIADO",
  "description": "Corrida matinal de 5km no parque. ATENÇÃO: Evento adiado devido à chuva.",
  "starts_at": "2025-01-27T10:00:00Z",
  "ends_at": "2025-01-27T11:00:00Z",
  "location_name": "Parque Ibirapuera",
  "location_address": "Av. Paulista, 1578 - Bela Vista, São Paulo - SP",
  "max_attendees": 60,
  "rsvp_deadline": "2025-01-26T23:59:59Z",
  "cover_image_url": "https://..."
}
```

**Response 200:** Same as GET /events/{id}

### DELETE /events/{id}
Cancel an event (requires event creator or group admin role).

**Response 204:** No content

## RSVP Management

### GET /events/{id}/rsvps
List event RSVPs.

**Query Parameters:**
- `status` (optional): Filter by RSVP status (`going`, `not_going`, `maybe`)
- `limit` (optional): Page size (default: 50, max: 100)
- `offset` (optional): Pagination offset

**Response 200:**
```json
{
  "rsvps": [
    {
      "id": "uuid",
      "user": {
        "id": "uuid",
        "display_name": "Carlos Santos",
        "avatar_url": "https://...",
        "location_city": "São Paulo"
      },
      "status": "going",
      "guests_count": 2,
      "note": "Vou com minha esposa e filho",
      "created_at": "2025-01-16T10:30:00Z",
      "updated_at": "2025-01-16T15:45:00Z"
    }
  ],
  "summary": {
    "going": 12,
    "not_going": 3,
    "maybe": 2,
    "total_with_guests": 18
  },
  "total": 17,
  "has_more": false
}
```

### POST /events/{id}/rsvp
Create or update user's RSVP for an event.

**Request Body:**
```json
{
  "status": "going",
  "guests_count": 1,
  "note": "Mal posso esperar!"
}
```

**Response 201:**
```json
{
  "rsvp": {
    "id": "uuid",
    "status": "going",
    "guests_count": 1,
    "note": "Mal posso esperar!",
    "created_at": "2025-01-17T11:15:00Z",
    "updated_at": "2025-01-17T11:15:00Z"
  }
}
```

### DELETE /events/{id}/rsvp
Remove user's RSVP from an event.

**Response 204:** No content

## User Events

### GET /users/me/events
List current user's events (events in groups they belong to).

**Query Parameters:** Same as GET /events

**Response 200:** Same format as GET /events

### GET /users/me/events/attending
List events the user is attending (has RSVP status "going").

**Query Parameters:**
- `time_filter` (optional): `upcoming` | `past` | `today` | `this_week` | `all` (default: `upcoming`)
- `limit` (optional): Page size (default: 20, max: 100)
- `offset` (optional): Pagination offset

**Response 200:** Same format as GET /events

## Error Responses

### 400 Bad Request
```json
{
  "error": "validation_error",
  "message": "Data de início deve ser no futuro",
  "details": {
    "field": "starts_at",
    "code": "invalid_date"
  }
}
```

### 403 Forbidden
```json
{
  "error": "insufficient_permissions",
  "message": "Você deve ser membro do grupo para criar eventos"
}
```

### 404 Not Found
```json
{
  "error": "event_not_found",
  "message": "Evento não encontrado ou você não tem acesso"
}
```

### 409 Conflict
```json
{
  "error": "event_full",
  "message": "Este evento já atingiu o limite de participantes"
}
```

### 422 Unprocessable Entity
```json
{
  "error": "rsvp_deadline_passed",
  "message": "O prazo para confirmação de presença já passou"
}
```

## Real-time Updates

### WebSocket Events
Events are pushed via Supabase Realtime to subscribed clients:

**Event Created:**
```json
{
  "type": "event_created",
  "group_id": "uuid",
  "event": { /* event object */ }
}
```

**RSVP Updated:**
```json
{
  "type": "rsvp_updated",
  "event_id": "uuid",
  "rsvp": { /* rsvp object */ },
  "summary": { /* updated counts */ }
}
```

**Event Updated:**
```json
{
  "type": "event_updated",
  "event": { /* updated event object */ }
}
```

## Rate Limits
- Event creation: 10 per hour per user
- RSVP updates: 50 per hour per user
- Event updates: 20 per hour per user
- General reads: 1000 per hour per user