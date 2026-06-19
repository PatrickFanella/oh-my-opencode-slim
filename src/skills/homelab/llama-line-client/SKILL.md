---
name: llama-line-client
description: >
  Build, integrate, or debug clients that talk to Switchyard's native model broker
  through llama-line/Ollama/OpenAI-compatible ingress on port 11434. Use this skill
  when writing client code for /api/chat, /api/generate, /v1/chat/completions,
  handling broker status/error events, configuring client identity and priority,
  checking /broker/status, or migrating from standalone llama-line to Switchyard.
---

# Switchyard Model Broker Compatibility Client Skill

Switchyard now owns the local model-broker runtime. The historical standalone
`llama-line.service` is legacy and should not run beside Switchyard. Clients that
previously used llama-line should point at Switchyard's compatibility ingress,
normally `http://<switchyard-host>:11434`.

Switchyard-compatible ingress preserves the useful llama-line client contract:

- Ollama-compatible endpoints for `/api/generate`, `/api/chat`, `/api/tags`, and
  embeddings.
- OpenAI-compatible endpoints for `/v1/chat/completions`, `/v1/completions`,
  `/v1/models`, and embeddings.
- Broker status/admin/history surfaces for migration and operations.
- Client attribution and priority via bearer-key mapping or trusted headers.

## Quick Reference

| What | Value |
|------|-------|
| Default broker URL | `http://127.0.0.1:11434` local, or LAN host such as `http://10.0.0.50:11434` |
| Runtime owner | Switchyard API / native model broker |
| Legacy service | Standalone `llama-line.service` should be disabled/removed |
| Client identity | `Authorization: Bearer <key>` mapped by `MODEL_BROKER_CLIENT_KEYS`, or `X-Switchyard-Client` / `X-Llama-Line-Client` |
| Client priority | `MODEL_BROKER_CLIENT_KEYS=name=token:priority`, `MODEL_BROKER_CLIENT_PRIORITIES`, or priority headers |
| Health/status | `GET /broker/status`, `GET /api/model-broker/status`, `GET /healthz` |
| Queue/admin compatibility | `/admin/queue`, `/admin/inflight`, `/api/history`, `/api/search`, `/api/logs`, `/api/config` |

## Runtime Ownership Rules

Do this:

- Treat Switchyard as the source of truth for local broker behavior.
- Point clients at Switchyard's `LLAMA_LINE_PORT` compatibility ingress.
- Point `OLLAMA_BASE_URL` inside Switchyard at the real upstream Ollama server,
  not back at Switchyard's own `11434` port.
- Use Switchyard systemd/Compose (`switchyard.service`) for host startup.

Do **not** do this:

- Do not restart or reintroduce standalone `llama-line.service` as the owner of
  port `11434`.
- Do not assume every endpoint has the old standalone llama-line implementation
  details such as runtime key CRUD, per-client cache stats, or a dedicated
  llama-line database.

## Client Identity and Priority

Switchyard restores llama-line-style caller attribution.

Preferred configuration on the Switchyard API environment:

```env
MODEL_BROKER_CLIENT_KEYS=subcorp=subcorp-secret:50,ci=ci-secret:10
```

Then clients send:

```http
Authorization: Bearer subcorp-secret
```

Switchyard records the request as client `subcorp` with priority `50` in broker
history, status, logs, audit, and OCQ compatibility surfaces.

Trusted fallback headers:

```http
X-Switchyard-Client: subcorp
X-Switchyard-Priority: 50
```

Also accepted for migration compatibility:

```http
X-Llama-Line-Client: subcorp
X-Llama-Line-Priority: 50
```

Last fallback is `X-Forwarded-For`, then the remote address.

Higher priority sorts ahead of lower priority for queued compatibility views.
Current synchronous compatibility requests start immediately; true scheduling
priority requires a native broker queue in front of execution.

## Response Modes

Switchyard differs from old standalone llama-line in one important way: not all
non-streaming compatibility responses are wrapped in SSE.

| Endpoint | Non-stream response | Streaming response |
| --- | --- | --- |
| `POST /api/chat` | Plain Ollama JSON | Use request-specific behavior if supported by caller |
| `POST /api/generate` | Plain Ollama JSON | Ollama-compatible streaming if the route uses streaming |
| `POST /v1/chat/completions` | Plain OpenAI JSON | `text/event-stream` OpenAI chunks plus Switchyard status/correlation events |
| `POST /v1/completions` | Plain OpenAI JSON | Compatibility only |

Client parsers should accept plain JSON for non-streaming requests and SSE for
explicit `stream:true` requests. Do not require SSE for `/api/chat`.

## Tool Calls and Empty Responses

Switchyard preserves structured tool calls:

- Ollama native `message.tool_calls` are preserved internally.
- Non-streaming `/v1/chat/completions` converts tool calls to OpenAI-compatible
  `message.tool_calls` with `finish_reason: "tool_calls"`.
- Empty assistant content with no tool calls is treated as a bad model response
  rather than a successful empty answer.
- Streaming tool-call-only OpenAI deltas are rejected by the Switchyard client
  path; use the non-streaming tool path for structured tool calls.

## Error and Status Events

Streaming compatibility responses can include status/error events before final
OpenAI chunks:

```text
event: status
data: {"status":"queued","request_id":"llama-...","backend":"switchyard-native"}

event: status
data: {"status":"running","request_id":"llama-...","backend":"switchyard-native"}
```

Terminal errors after SSE headers are committed are emitted as error/status
payloads rather than HTTP status changes:

```text
event: error
data: {"status":"failed","request_id":"llama-...","error":"...","backend":"switchyard-native"}

data: [DONE]
```

Client parsing strategy:

1. If response `Content-Type` is JSON, parse it directly.
2. If response is SSE, ignore broker `status: queued/running/completed` events.
3. Treat `status: failed`, `ollama_unavailable`, or OpenAI top-level `error` as
   terminal failures.
4. Process the remaining Ollama/OpenAI payloads normally.

## Broker Status

```http
GET /broker/status
```

Example shape:

```json
{
  "status": "healthy",
  "backend": "switchyard-native",
  "queue_depth": 0,
  "active_request": true,
  "connected_clients": 1,
  "queue": [
    {"id":"llama-...","client":"subcorp","priority":50,"status":"queued"}
  ],
  "inflight": [
    {"id":"llama-...","client":"subcorp","priority":50,"status":"running"}
  ],
  "upstreams": [...]
}
```

Use `/broker/status` for health checks, operator dashboards, backpressure hints,
and verifying client attribution.

## Admin and History Compatibility

Supported compatibility surfaces include:

| Method | Path | Action |
|--------|------|--------|
| `GET` | `/admin/queue` | List queued compatibility requests |
| `DELETE` | `/admin/queue` | Cancel all queued/running compatibility requests |
| `DELETE` | `/admin/queue/{id}` | Cancel one request |
| `GET` | `/admin/inflight` | List inflight compatibility requests |
| `POST` | `/admin/inflight/cancel` | Cancel inflight request(s) |
| `GET` | `/api/history` | Durable broker request history |
| `GET` | `/api/search?q=...` | Search broker request ledger |
| `GET` | `/api/logs` | Log-like broker request view |
| `GET` | `/admin/audit` | Audit-like broker request view |

Do not assume old standalone llama-line key-management endpoints are available;
configure Switchyard client keys through environment/configuration instead.

## Client Implementation Patterns

See `references/patterns.md` for current Python, Go, JavaScript, and OpenAI SDK
patterns that accept Switchyard's JSON-or-SSE compatibility behavior.

## Key Differences From Direct Ollama

1. **Switchyard owns routing** — provider-style models go through OpenCode;
   local/Ollama models go to `OLLAMA_BASE_URL`.
2. **Client identity** — bearer keys and trusted headers resolve to client names
   and priority for observability.
3. **Correlation** — responses include Switchyard/OCQ/llama-line request headers
   where possible.
4. **Tool-call preservation** — tool-call-only non-streaming responses are valid;
   empty no-tool completions are rejected.
5. **Compatibility surfaces** — `/broker/status`, admin queue/inflight, history,
   logs, audit, and OCQ request views are backed by Switchyard's native ledger.
