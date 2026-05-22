# llama-line Client Patterns

## Python — Streaming Inference with SSE Parsing

```python
import json
import requests

BROKER = "http://localhost:11434"
API_KEY = "your-key-here"

def call_llama_line(model: str, prompt: str):
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {"model": model, "prompt": prompt, "stream": True}

    with requests.post(f"{BROKER}/api/generate", json=payload, headers=headers, stream=True) as resp:
        resp.raise_for_status()
        sse_done = False
        for line in resp.iter_lines(decode_unicode=True):
            if not sse_done:
                if line.startswith("data: "):
                    update = json.loads(line[6:])
                    print(f"[queue] position={update['position']} wait={update['wait_seconds']}s status={update['status']}")
                    continue
                else:
                    sse_done = True  # first non-SSE line: ollama stream begins
            if line:
                chunk = json.loads(line)
                print(chunk.get("response", ""), end="", flush=True)
                if chunk.get("done"):
                    break
```

## Python — Non-Streaming (stream=False)

```python
def call_llama_line_sync(model: str, prompt: str) -> str:
    headers = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}
    payload = {"model": model, "prompt": prompt, "stream": False}

    with requests.post(f"{BROKER}/api/generate", json=payload, headers=headers, stream=True) as resp:
        resp.raise_for_status()
        buffer = b""
        sse_done = False
        for chunk in resp.iter_content(chunk_size=None):
            buffer += chunk
            while b"\n" in buffer:
                line, buffer = buffer.split(b"\n", 1)
                line = line.decode().strip()
                if not sse_done:
                    if line.startswith("data: "):
                        continue  # discard SSE status
                    else:
                        sse_done = True
                if line:
                    return json.loads(line)["response"]
```

## Go — SSE Loop with bufio.Scanner

```go
package main

import (
    "bufio"
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
    "strings"
)

const broker = "http://localhost:11434"
const apiKey = "your-key-here"

type StatusUpdate struct {
    Position    int    `json:"position"`
    WaitSeconds int    `json:"wait_seconds"`
    Status      string `json:"status"`
}

func callLlamaLine(model, prompt string) error {
    body, _ := json.Marshal(map[string]any{
        "model":  model,
        "prompt": prompt,
        "stream": true,
    })
    req, _ := http.NewRequest("POST", broker+"/api/generate", bytes.NewReader(body))
    req.Header.Set("Authorization", "Bearer "+apiKey)
    req.Header.Set("Content-Type", "application/json")

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        return err
    }
    defer resp.Body.Close()

    scanner := bufio.NewScanner(resp.Body)
    sseDone := false
    for scanner.Scan() {
        line := scanner.Text()
        if !sseDone {
            if strings.HasPrefix(line, "data: ") {
                var u StatusUpdate
                json.Unmarshal([]byte(line[6:]), &u)
                fmt.Printf("[queue] pos=%d wait=%ds status=%s\n", u.Position, u.WaitSeconds, u.Status)
                continue
            }
            sseDone = true
        }
        if line == "" {
            continue
        }
        var chunk map[string]any
        json.Unmarshal([]byte(line), &chunk)
        fmt.Print(chunk["response"])
        if done, _ := chunk["done"].(bool); done {
            break
        }
    }
    return scanner.Err()
}
```

## JavaScript — fetch with SSE Parsing

```javascript
const BROKER = 'http://localhost:11434';
const API_KEY = 'your-key-here';

async function callLlamaLine(model, prompt) {
  const resp = await fetch(`${BROKER}/api/generate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, prompt, stream: true }),
  });

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let sseDone = false;
  let buf = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop(); // keep incomplete line

    for (const line of lines) {
      if (!sseDone) {
        if (line.startsWith('data: ')) {
          const update = JSON.parse(line.slice(6));
          console.log('[queue]', update);
          continue;
        }
        sseDone = true;
      }
      if (!line.trim()) continue;
      const chunk = JSON.parse(line);
      process.stdout.write(chunk.response ?? '');
      if (chunk.done) return;
    }
  }
}
```

## OpenAI-Compatible API (v1 endpoints)

llama-line also queues `/v1/chat/completions`, `/v1/completions`, `/v1/embeddings`. Use any
OpenAI-compatible client by pointing it at the broker and adding the API key:

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:11434/v1",
    api_key="your-key-here",  # llama-line key, not OpenAI
)

# SSE preamble is transparent to the OpenAI client library — it handles it correctly
response = client.chat.completions.create(
    model="qwen3.5:latest",
    messages=[{"role": "user", "content": "Hello"}],
)
print(response.choices[0].message.content)
```

> **Note:** The OpenAI Python client handles the SSE preamble transparently because it reads
> `data:` lines as part of the SSE protocol. No special handling needed.

## Backpressure — Check Before Sending

For batch jobs or high-throughput clients, poll `/broker/status` before sending to avoid 503s:

```python
def wait_for_queue_space(max_depth_fraction=0.8, poll_interval=2.0):
    import time
    while True:
        r = requests.get(f"{BROKER}/broker/status")
        s = r.json()
        if s["queue_depth"] < s["max_depth"] * max_depth_fraction:
            return
        print(f"Queue {s['queue_depth']}/{s['max_depth']}, waiting...")
        time.sleep(poll_interval)
```

## Error Handling

```python
def safe_call(model, prompt):
    try:
        resp = requests.post(
            f"{BROKER}/api/generate",
            json={"model": model, "prompt": prompt, "stream": False},
            headers={"Authorization": f"Bearer {API_KEY}"},
        )
        if resp.status_code == 503:
            err = resp.json()
            raise Exception(f"Queue full ({err['queue_depth']}/{err['max_depth']})")
        if resp.status_code == 504:
            raise Exception(f"Timeout: {resp.json()['error']}")
        if resp.status_code == 401:
            raise Exception("Invalid API key")
        resp.raise_for_status()
        # strip SSE preamble for non-streaming
        body = resp.text
        lines = [l for l in body.splitlines() if l and not l.startswith("data: ")]
        return json.loads(lines[0])["response"]
    except requests.RequestException as e:
        raise Exception(f"Broker unreachable: {e}")
```

## Health Check

```python
def broker_healthy() -> bool:
    try:
        r = requests.get(f"{BROKER}/broker/status", timeout=2)
        return r.status_code == 200
    except Exception:
        return False
```
