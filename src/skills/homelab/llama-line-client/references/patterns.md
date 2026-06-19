# Switchyard Model Broker Client Patterns

Switchyard exposes llama-line/Ollama/OpenAI-compatible ingress on port `11434`,
but the current runtime is Switchyard-native. Clients should accept either plain
JSON or SSE depending on endpoint and `stream` mode.

Use bearer keys when Switchyard is configured with `MODEL_BROKER_CLIENT_KEYS`:

```env
MODEL_BROKER_CLIENT_KEYS=subcorp=subcorp-secret:50
```

Then the client request:

```http
Authorization: Bearer subcorp-secret
```

is recorded as client `subcorp` with priority `50`.

## Python — JSON-or-SSE Response Parser

```python
import json
import requests

BROKER = "http://localhost:11434"
API_KEY = "subcorp-secret"

TERMINAL_STATUSES = {"failed", "ollama_unavailable", "dropped_by_admin"}
IGNORED_STATUSES = {"queued", "running", "completed"}

def parse_switchyard_response(resp: requests.Response):
    content_type = resp.headers.get("content-type", "")
    resp.raise_for_status()

    if "text/event-stream" not in content_type:
        return resp.json()

    for raw_line in resp.iter_lines(decode_unicode=True):
        if not raw_line or raw_line == "data: [DONE]":
            continue
        if not raw_line.startswith("data: "):
            continue
        payload = json.loads(raw_line[6:])
        if "error" in payload and isinstance(payload["error"], dict):
            raise RuntimeError(payload["error"].get("message", "model broker error"))
        status = payload.get("status")
        if status in IGNORED_STATUSES:
            continue
        if status in TERMINAL_STATUSES:
            raise RuntimeError(payload.get("message") or payload.get("error") or status)
        return payload
    raise RuntimeError("broker stream ended without a model payload")

def generate(model: str, prompt: str) -> str:
    resp = requests.post(
        f"{BROKER}/api/generate",
        json={"model": model, "prompt": prompt, "stream": False},
        headers={"Authorization": f"Bearer {API_KEY}"},
        stream=True,
        timeout=600,
    )
    data = parse_switchyard_response(resp)
    return data.get("response") or data.get("message", {}).get("content", "")
```

## Python — Streaming OpenAI-Compatible Chat

```python
def stream_chat(model: str, messages: list[dict]):
    resp = requests.post(
        f"{BROKER}/v1/chat/completions",
        json={"model": model, "messages": messages, "stream": True},
        headers={"Authorization": f"Bearer {API_KEY}"},
        stream=True,
        timeout=600,
    )
    resp.raise_for_status()

    for raw_line in resp.iter_lines(decode_unicode=True):
        if not raw_line or raw_line == "data: [DONE]":
            continue
        if not raw_line.startswith("data: "):
            continue
        payload = json.loads(raw_line[6:])
        status = payload.get("status")
        if status in {"queued", "running", "completed"}:
            continue
        if status in {"failed", "ollama_unavailable", "dropped_by_admin"}:
            raise RuntimeError(payload.get("error") or payload.get("message") or status)
        if "error" in payload:
            raise RuntimeError(payload["error"].get("message", "model broker error"))
        for choice in payload.get("choices", []):
            delta = choice.get("delta", {})
            text = delta.get("content") or choice.get("text") or ""
            if text:
                yield text
```

## Go — JSON-or-SSE Parser

```go
package switchyardbroker

import (
    "bufio"
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "strings"
)

const Broker = "http://localhost:11434"
const APIKey = "subcorp-secret"

func DoGenerate(model, prompt string) (map[string]any, error) {
    body, _ := json.Marshal(map[string]any{"model": model, "prompt": prompt, "stream": false})
    req, _ := http.NewRequest("POST", Broker+"/api/generate", bytes.NewReader(body))
    req.Header.Set("Authorization", "Bearer "+APIKey)
    req.Header.Set("Content-Type", "application/json")

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    if resp.StatusCode >= 400 {
        b, _ := io.ReadAll(resp.Body)
        return nil, fmt.Errorf("broker status %s: %s", resp.Status, string(b))
    }
    return parseBrokerBody(resp)
}

func parseBrokerBody(resp *http.Response) (map[string]any, error) {
    if !strings.Contains(resp.Header.Get("Content-Type"), "text/event-stream") {
        var out map[string]any
        return out, json.NewDecoder(resp.Body).Decode(&out)
    }

    scanner := bufio.NewScanner(resp.Body)
    for scanner.Scan() {
        line := scanner.Text()
        if line == "" || line == "data: [DONE]" || !strings.HasPrefix(line, "data: ") {
            continue
        }
        var payload map[string]any
        if err := json.Unmarshal([]byte(strings.TrimPrefix(line, "data: ")), &payload); err != nil {
            return nil, err
        }
        if status, _ := payload["status"].(string); status != "" {
            switch status {
            case "queued", "running", "completed":
                continue
            case "failed", "ollama_unavailable", "dropped_by_admin":
                return nil, fmt.Errorf("broker terminal status: %s", status)
            }
        }
        if errPayload, ok := payload["error"].(map[string]any); ok {
            return nil, fmt.Errorf("broker error: %v", errPayload["message"])
        }
        return payload, nil
    }
    if err := scanner.Err(); err != nil {
        return nil, err
    }
    return nil, fmt.Errorf("broker stream ended without model payload")
}
```

## JavaScript — fetch with JSON-or-SSE Handling

```javascript
const BROKER = 'http://localhost:11434';
const API_KEY = 'subcorp-secret';

async function callGenerate(model, prompt) {
  const resp = await fetch(`${BROKER}/api/generate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, prompt, stream: false }),
  });
  if (!resp.ok) throw new Error(`broker status ${resp.status}: ${await resp.text()}`);

  const contentType = resp.headers.get('content-type') || '';
  if (!contentType.includes('text/event-stream')) return await resp.json();

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop();
    for (const line of lines) {
      if (!line || line === 'data: [DONE]' || !line.startsWith('data: ')) continue;
      const payload = JSON.parse(line.slice(6));
      if (['queued', 'running', 'completed'].includes(payload.status)) continue;
      if (['failed', 'ollama_unavailable', 'dropped_by_admin'].includes(payload.status)) {
        throw new Error(payload.error || payload.message || payload.status);
      }
      if (payload.error) throw new Error(payload.error.message || 'broker error');
      return payload;
    }
  }
  throw new Error('broker stream ended without model payload');
}
```

## OpenAI SDK Integration

For OpenAI-compatible clients, use Switchyard's `/v1` base URL. Non-streaming
SDK calls receive standard JSON. Streaming calls receive standard SSE chunks,
with possible Switchyard status/error events that robust clients should ignore
or handle.

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:11434/v1",
    api_key="subcorp-secret",  # Switchyard model broker key, not OpenAI
)

response = client.chat.completions.create(
    model="qwen3:14b",
    messages=[{"role": "user", "content": "Hello"}],
)
print(response.choices[0].message.content)
```

For tool calls, prefer non-streaming `/v1/chat/completions`; Switchyard preserves
`message.tool_calls` and rejects empty no-tool responses.

## Backpressure and Health

```python
def broker_status():
    return requests.get(f"{BROKER}/broker/status", timeout=2).json()

def broker_healthy() -> bool:
    try:
        status = broker_status()
        return status.get("status") == "healthy" or status.get("backend") == "switchyard-native"
    except Exception:
        return False
```

Use the `client` and `priority` fields in `/broker/status`, `/api/history`,
`/api/logs`, and `/admin/audit` to confirm attribution.
