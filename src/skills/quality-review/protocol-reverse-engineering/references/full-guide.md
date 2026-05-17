# Protocol Reverse Engineering Full Guide

Detailed material moved from `SKILL.md`.

## Traffic Capture

### Wireshark / tshark

```bash
wireshark -i eth0 -k
wireshark -i eth0 -k -f "port 443"
tshark -i eth0 -w capture.pcap
tshark -i eth0 -b filesize:100000 -b files:10 -w capture.pcap
```

### tcpdump

```bash
tcpdump -i eth0 -w capture.pcap
tcpdump -i eth0 port 8080 -w capture.pcap
tcpdump -i eth0 -s 0 -w capture.pcap
tcpdump -i eth0 -X port 80
```

### MITM capture (HTTP/HTTPS contexts)

```bash
mitmproxy --mode transparent -p 8080
mitmproxy --mode transparent --ssl-insecure
mitmdump -w traffic.mitm
```

Use only where authorized.

---

## Analysis Workbench

### Wireshark filters and actions

Useful filters:

- `tcp.port == 8080`
- `http.request.method == "POST"`
- `tcp.flags.syn == 1 && tcp.flags.ack == 0`
- `frame contains "password"`

Actions:

- Follow TCP/HTTP stream
- Export protocol objects
- Configure TLS key log / RSA keys in TLS preferences

### tshark extraction

```bash
tshark -r capture.pcap -T fields -e ip.src -e ip.dst -e tcp.port
tshark -r capture.pcap -q -z conv,tcp
tshark -r capture.pcap -q -z endpoints,ip
tshark -r capture.pcap -Y "http" -T json > http_traffic.json
tshark -r capture.pcap -q -z io,phs
```

### Scapy-based scripting

Use Scapy for:

- packet inspection and filtering
- custom packet crafting
- replay + controlled mutation

---

## Protocol Identification

Common signatures:

- HTTP: `GET`/`POST`/`HTTP/1.`
- TLS: `0x16 0x03`
- SMB: `0xFF 0x53 0x4D 0x42`
- SSH: `SSH-2.0`
- Redis RESP: `*` array prefix

Typical framing fields to locate:

- magic/signature
- version
- flags
- message type/opcode
- length
- sequence/session id
- payload

---

## Binary Structure Patterns

Expect one of:

1. Length-prefixed messages
2. TLV (`type,length,value`)
3. Fixed header + variable payload

Parser implementation pattern:

- parse header by explicit endianness (`struct.unpack`)
- validate length before slice
- iterate until stream exhaustion
- collect unknown field/value sets for iterative decoding

Hex dump utilities help visually spot field boundaries and plaintext islands.

---

## Encryption / Compression Assessment

Entropy heuristics:

- `< 6.0`: likely plaintext/structured
- `6.0–7.5`: possibly compressed
- `> 7.5`: likely encrypted/random

TLS metadata extraction:

```bash
tshark -r capture.pcap -Y "ssl.handshake" -T fields -e ip.src -e ssl.handshake.ciphersuite
tshark -r capture.pcap -Y "ssl.handshake.type == 1" -T fields -e ssl.handshake.ja3
tshark -r capture.pcap -Y "ssl.handshake.type == 2" -T fields -e ssl.handshake.ja3s
```

Decryption path (when available/authorized): browser `SSLKEYLOGFILE` + Wireshark TLS prefs.

---

## Protocol Documentation Template

Your spec should include:

1. Overview + purpose
2. Transport (TCP/UDP/port/encryption)
3. Message framing with offset tables
4. Message type catalog
5. Per-message body schemas
6. State machine transitions
7. Handshake and sample exchanges
8. Error codes and boundary behavior

Offset table example shape:

| Offset | Size | Field | Description |
|---:|---:|---|---|
| 0 | 4 | Magic | Signature |
| 4 | 2 | Version | Protocol version |
| 6 | 2 | Type | Message type |
| 8 | 4 | Length | Payload bytes |

---

## Operationalization

### Wireshark dissector

Lua dissector should:

- register protocol fields
- parse header/payload by offsets
- map type codes to names
- register dissector by port

### Active testing

- fuzz with Boofuzz using inferred framing
- replay captured packets
- mutate payload/type/length/checksum fields
- observe crash, reject, timeout, state desync behavior

---

## Best-Practice Sequence

1. Capture broad scenarios
2. Find framing boundaries
3. Infer field semantics by differential comparison
4. Encode assumptions in parser
5. Validate with replay/mutation
6. Write canonical spec
7. Re-test edge cases and revise

Watch for recurring fields:

- magic numbers
- protocol versioning
- length guards
- opcodes
- sequence counters
- integrity checksums/CRCs
- timestamps/session IDs
