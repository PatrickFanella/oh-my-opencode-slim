---
name: llama-line-client
description: >
  Build, integrate, or debug applications that talk to the llama-line ollama broker.
  llama-line is a local HTTP gateway that serialises GPU inference requests into a FIFO queue,
  streams SSE queue-position status to waiting clients, and proxies ollama responses transparently.
  Use this skill when: writing client code to call llama-line, handling SSE status events from the
  broker, implementing auth (Bearer token), dealing with queue-full or timeout errors, checking
  broker health via /broker/status, or understanding how llama-line differs from calling ollama directly.
---

# llama-line Client Skill

llama-line sits in front of ollama at `http://<host>:11434` (default). Clients talk to it exactly
like ollama, with two additions: a required `Authorization` header and SSE status events prepended
to inference responses.

## Quick Reference

| What | Value |
|------|-------|
| Default listen port | `11434` (replaces ollama's port) |
| Auth header | `Authorization: Bearer <key>` |
| Auth-free endpoint | `GET /broker/status` |
| Inference endpoints (queued) | `/api/generate`, `/api/chat`, `/api/embed`, `/v1/chat/completions`, `/v1/completions`, `/v1/embeddings` |
| All other paths | Proxied immediately, no queue |

## Authentication

Every request (except `/broker/status`) must include:

```http
Authorization: Bearer <key>
```

Missing or invalid key → `401 {"error": "unauthorized"}`.

Keys are defined in the broker's config file as `{name, key}` pairs. The `name` identifies the
client in logs and `/broker/status`.

## Inference Requests

Send requests exactly as you would to ollama. The broker prepends SSE status events before the
ollama response body:

```
data: {"position":1,"wait_seconds":3,"status":"queued"}

data: {"position":0,"wait_seconds":5,"status":"queued"}

<ollama response stream begins here>
```

**Handling SSE preamble:** Read lines until you hit the ollama response. SSE lines start with
`data: ` and end with `\n\n`. The ollama response starts immediately after — it is NOT wrapped in
SSE format. Parse strategy:

1. Read lines; if line starts with `data: `, decode JSON as `StatusUpdate` and handle/discard
2. Once you hit a non-`data:` line (or blank line after last SSE event), the ollama stream has begun
3. Hand off remaining bytes to your normal ollama response parser

**StatusUpdate fields:**
- `position` — 1-based queue position; `0` means currently in-flight (about to run)
- `wait_seconds` — seconds since the request was enqueued
- `status` — `"queued"` normally; `"ollama_unavailable"` when broker can't reach ollama

## Error Responses

All broker errors use ollama's format + `X-Ollama-Broker: true` header:

| HTTP | Body | When |
|------|------|------|
| 401 | `{"error":"unauthorized"}` | Bad/missing API key |
| 503 | `{"error":"queue full","queue_depth":N,"max_depth":N}` | Queue at capacity |
| 504 | `{"error":"request timeout"}` | Per-request timeout exceeded |
| 504 | `{"error":"queue wait timeout"}` | Waited too long in queue |
| 502 | `{"error":"..."}` | ollama unreachable after retries |

Detect broker errors vs ollama errors via the `X-Ollama-Broker: true` response header.

## Broker Status

```http
GET /broker/status
```

No auth required. Returns:

```json
{
  "queue_depth": 2,
  "max_depth": 10,
  "in_flight_client": "my-app",
  "connected_clients": 3
}
```

Use this for health checks, monitoring, and backpressure decisions.

## Client Implementation Patterns

See `references/patterns.md` for:
- Python example (requests + SSE parsing)
- Go example (bufio.Scanner SSE loop)
- JavaScript/fetch example
- Backpressure: checking `/broker/status` before sending
- Retry logic for 503/504 responses
- Streaming vs non-streaming inference

## Key Differences from Direct ollama

1. **Auth required** — add `Authorization: Bearer <key>` to every request
2. **SSE preamble** — inference responses start with `data:` status lines before the ollama body
3. **Queue errors** — may receive 503 (queue full) or 504 (timeout) that ollama never sends
4. **Port** — broker listens on `11434`; ollama moved to `11435` (or wherever configured)
5. **`/broker/status`** — broker-only endpoint, not proxied to ollama
