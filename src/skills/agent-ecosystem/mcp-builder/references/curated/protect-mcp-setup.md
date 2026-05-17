# Protect Mcp Setup

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `protect-mcp-setup-skill.md`

_Source topic: protect-mcp-setup_

**Purpose:** Configure Cedar policy enforcement and Ed25519 signed receipts for Claude Code tool calls. Use when setting up projects that need cryptographic audit trails, policy-gated tool execution, or compliance-ready evidence of agent actions.

# protect-mcp — Policy Enforcement + Signed Receipts

Cryptographic governance for every Claude Code tool call. Each invocation is
evaluated against a Cedar policy and produces an Ed25519-signed receipt that
anyone can verify offline.

## Overview

- **Cedar policies** (AWS's open authorization engine) evaluate every tool call
- **Ed25519 receipts** record each decision with its inputs, the policy that
- **Offline verification** via `npx @veritasacta/verify`. No server, no account,

## Problem

- Mutable — anyone with access can edit it
- Unsigned — there is no way to prove integrity
- Operator-bound — verification requires trusting whoever holds the log

## Solution

```bash

# 4. Use Claude Code normally. Every tool call is now policy-evaluated

#    and produces a signed receipt in ./receipts/
```

## Hook Configuration

Add the following to your project's `.claude/settings.json`:

```json
          "type": "command",
          "command": "npx protect-mcp@latest evaluate --policy ./protect.cedar --tool \"$TOOL_NAME\" --input \"$TOOL_INPUT\" || exit 2"
          "type": "command",
          "command": "npx protect-mcp@latest sign --tool \"$TOOL_NAME\" --input \"$TOOL_INPUT\" --output \"$TOOL_OUTPUT\" --receipts ./receipts/"
```

### What each hook does

**PreToolUse** — Runs BEFORE the tool executes. Evaluates the tool call against
your Cedar policy file. If Cedar returns `deny`, the hook exits with code 2 and
Claude Code blocks the tool call entirely.

**PostToolUse** — Runs AFTER the tool completes. Signs a receipt containing the
tool name, input hash, output hash, decision, policy digest, and timestamp.
Writes the receipt to `./receipts/<timestamp>.json`.

## Cedar Policy File

Create `./protect.cedar` at the project root:

```cedar
    resource

    resource
) when {

    resource
) when {
...

# Exit 2 = malformed
```

Verify the entire chain:

```bash
npx @veritasacta/verify receipts/*.json
```

Use the plugin's slash commands from within Claude Code:

```
```

## Receipt Format

Each receipt is a JSON file with this structure:

```json
  "decision": "allow",
```

- **Ed25519** signatures (RFC 8032)
- **JCS canonicalization** (RFC 8785) before signing
- **Hash-chained** to the previous receipt via `parent_receipt_id`
- **Offline verifiable** — no network call, no vendor lookup
