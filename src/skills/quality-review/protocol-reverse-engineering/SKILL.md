---
name: protocol-reverse-engineering
description: Master network protocol reverse engineering including packet analysis, protocol dissection, and custom protocol documentation. Use when analyzing network traffic, understanding proprietary protocols, or debugging network communication.
---

# Protocol Reverse Engineering

Reverse unknown or proprietary network protocols using capture, dissection, hypothesis testing, and specification writing.

## Purpose

Use this skill to infer protocol behavior and structure from traffic, then document findings into implementable parsers/dissectors.

## When to Use This Skill

- Unknown binary/text protocol analysis
- Interoperability debugging between systems/services
- Security research and communication-path auditing
- Building parser/dissector/emulator from observed traffic

## When Not to Use

- You already have trusted protocol docs
- Task is generic app-layer bug triage without protocol uncertainty
- Work violates legal/contract boundaries for traffic inspection

## Workflow

1. **Capture representative traffic**
   - Multiple sessions, success + failure paths
   - Tools: Wireshark/tshark/tcpdump (optionally MITM for HTTP/TLS contexts)
2. **Segment and label flows**
   - Group by host/port/session
   - Identify request/response boundaries and timing
3. **Infer message structure**
   - Locate magic/version/type/length/checksum fields
   - Detect TLV or fixed-header + variable-payload patterns
4. **Classify protocol and payload encoding**
   - Signature checks, entropy checks, compression/encryption hints
5. **Validate hypotheses with code**
   - Parse samples via Scapy/Python scripts
   - Replay/mutate packets and observe server behavior
6. **Document protocol spec**
   - Transport, framing, message types, state machine, examples
7. **Operationalize results**
   - Build Wireshark dissector/parser/fuzzer harness

## Output Checklist

- [ ] Capture set includes enough scenario diversity
- [ ] Message framing rules identified and tested
- [ ] Field map (offset/size/type/semantics) documented
- [ ] State transitions and error paths captured
- [ ] Encryption/compression status assessed
- [ ] Parser/dissector prototype validates core assumptions
- [ ] Final protocol spec includes examples and limits

## Resources

- Full guide: `references/full-guide.md`
