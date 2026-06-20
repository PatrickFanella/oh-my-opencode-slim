# Edda API Reference for Play Loops

Default public base URL:

```text
https://edda.subcult.tv
```

## Authentication

Use Bearer JWT for external HTTP API calls.

```bash
curl -sS https://edda.subcult.tv/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","password":"..."}'
```

Response shape:

```json
{
  "token": "<jwt>",
  "user": { "id": "...", "name": "...", "email": "..." }
}
```

For subsequent HTTP requests:

```bash
curl -sS https://edda.subcult.tv/api/v1/auth/me \
  -H "Authorization: Bearer $EDDA_TOKEN"
```

Logout clears the HttpOnly `gm_token` cookie when a browser/cookie jar is involved:

```bash
curl -i -X POST https://edda.subcult.tv/api/v1/auth/logout \
  -H "Authorization: Bearer $EDDA_TOKEN"
```

Notes:

- REST should use `Authorization: Bearer <token>`.
- Do not put JWTs in URLs.
- Browser WebSocket auth may use the HttpOnly `gm_token` cookie; scripts should prefer HTTP `/action` unless streaming is required.

## Play State Routes

All routes below require `Authorization: Bearer $EDDA_TOKEN`.

```text
GET  /api/v1/campaigns/                       # list campaigns
GET  /api/v1/campaigns/{id}/                  # campaign record
GET  /api/v1/campaigns/{id}/history           # session log entries
GET  /api/v1/campaigns/{id}/character         # player character
GET  /api/v1/campaigns/{id}/character/inventory
GET  /api/v1/campaigns/{id}/quests            # active/known quests
GET  /api/v1/campaigns/{id}/locations         # known locations
GET  /api/v1/campaigns/{id}/npcs/encountered  # encountered NPCs
GET  /api/v1/campaigns/{id}/facts             # known world facts
GET  /api/v1/campaigns/{id}/map
GET  /api/v1/campaigns/{id}/time
```

## Submit One Turn

HTTP turn submission:

```bash
curl -sS -X POST "https://edda.subcult.tv/api/v1/campaigns/$CAMPAIGN_ID/action" \
  -H "Authorization: Bearer $EDDA_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"input":"I examine the old gate and listen for movement beyond it."}'
```

Request body:

```json
{ "input": "<player action>" }
```

Response shape:

```json
{
  "narrative": "...",
  "state_changes": [
    { "entity_type": "...", "entity_id": "...", "change_type": "...", "details": {} }
  ],
  "combat_active": false
}
```

## WebSocket Streaming

Streaming route:

```text
GET /api/v1/campaigns/{id}/ws
```

Client message:

```json
{ "type": "action", "payload": { "input": "<player action>" } }
```

Server envelopes:

```json
{ "type": "chunk", "payload": { "text": "..." }, "timestamp": "..." }
{ "type": "status", "payload": { "stage": "...", "description": "..." }, "timestamp": "..." }
{ "type": "result", "payload": { "narrative": "...", "state_changes": [], "combat_active": false }, "timestamp": "..." }
{ "type": "error", "payload": { "error": "..." }, "timestamp": "..." }
```

Use HTTP `/action` for simple loops. Use WebSocket only when streaming chunks/status are important and the loop has a WebSocket-capable client.
