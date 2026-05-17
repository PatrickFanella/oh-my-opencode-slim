# Openclaw Secure Linux Cloud

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `openclaw-secure-linux-cloud-skill.md`

_Source topic: openclaw-secure-linux-cloud_

**Purpose:** Use when self-hosting OpenClaw on a cloud server, hardening a remote OpenClaw gateway, choosing between SSH tunneling, Tailscale, or reverse-proxy exposure, or reviewing Podman, pairing, sandboxing, token auth, and tool-permission defaults for a secure personal deployment.

## Overview

Use this skill for the conservative "deploy first, expose later" pattern for
OpenClaw on a cloud server.

Default to a private control plane:

- Harden the Linux host before exposing anything.
- Keep the gateway bound to `127.0.0.1`.
- Reach the Control UI through an SSH tunnel first.
- Keep token authentication, pairing, and sandboxing enabled.
- Start with a narrow tool profile and loosen only with an explicit need.

Open `references/REFERENCE.md` when you need the
command matrix, baseline config shape, checklist, or access-path comparison.

## When To Use

Use this skill when the user mentions any of the following:

- OpenClaw on a cloud server, VM, or other Linux host
- Secure self-hosting, hardening, or "run it privately"
- Podman, loopback binding, SSH tunneling, or remote Control UI access
- Tailscale vs reverse proxy for OpenClaw
- Pairing, sandboxing, token auth, or locked-down tool permissions
- Reviewing whether an existing OpenClaw host is too exposed

Do not use this skill for:

- General Linux hardening with no OpenClaw component
- Local single-machine onboarding where remote access is irrelevant
- Pure local onboarding with no remote-host hardening questions
- Non-Linux hosting unless the user explicitly wants this Linux-first pattern

## Workflow

### 1. Classify the request

Put the task in one of these buckets before giving detailed guidance:

1. **Fresh deploy**: the user wants to stand up OpenClaw securely on a Linux
   cloud host from scratch.
2. **Hardening review**: the user already has OpenClaw running and wants to
   reduce exposure or audit risky defaults.
3. **Access-model decision**: the user is choosing between SSH tunneling,

### 2. Start from the secure baseline

- Harden the Linux host first: updates, SSH keys, SSH lock-down, and a
- Run OpenClaw under rootless Podman rather than as a root-owned long-lived
  process.
- Keep the gateway on loopback only.
- Keep the Control UI private and access it through an SSH tunnel.
- Require token authentication.
- Keep pairing enabled for inbound messaging channels.
- Start with a minimal tool set and sandbox sessions by default.

- Binding the gateway to `0.0.0.0`
- Opening port `18789` to the public internet
- Turning on broad runtime, filesystem, automation, or browser access by
- Leaving `~/.openclaw` readable by other local users

### 3. Separate local and server actions

- **Local machine actions**: SSH key generation, tunnel setup, browser access
- **Server actions**: Linux hardening, Podman install path, OpenClaw service

### 4. Ask only for blocking facts

- Linux distro and host access details when package-manager or firewall
...

## Output Expectations

For a fresh deployment, provide:

- A short architecture summary
- Local-vs-server steps
- A conservative config baseline
- A pre-launch checklist
- A short "what not to expose" warning

- The likely risks in the current setup
- A prioritized remediation sequence
- Any immediate exposure concerns to fix before anything else

For an access-path decision, provide:

- A recommendation

### From `REFERENCE.md`

_Source topic: REFERENCE_

# OpenClaw Secure Linux Cloud Reference

This reference supports the `openclaw-secure-linux-cloud` skill.

It adapts the deployment pattern from Xi Xu's Debian-focused article, "Run
OpenClaw Securely on a Debian Cloud Server: A Complete Guide from Setup to
Hardening," published on March 13, 2026, along with current upstream OpenClaw
repository guidance. The package names and firewall commands in the article are

## Architecture Summary

- Linux host exposes only SSH by default
- OpenClaw runs under rootless Podman
- The gateway listens on loopback only
- The Control UI is reached through an SSH tunnel
- Token authentication stays enabled
- Pairing stays enabled for inbound channels
- Tool access stays narrow by default
- Sandboxing remains enabled unless there is a deliberate reason to relax it

## Command Matrix

### Local Machine

Use these steps on the machine you are connecting from:

```bash
export VPS_USER="your_admin_user"
export VPS_HOST="your.server.ip.or.domain"

ssh-keygen -t ed25519 -C "openclaw-cloud"
ssh-copy-id "${VPS_USER}@${VPS_HOST}"
ssh "${VPS_USER}@${VPS_HOST}"
```

```bash
export VPS_USER="your_admin_user"
export VPS_HOST="your.server.ip.or.domain"

ssh -N -L 18789:127.0.0.1:18789 "${VPS_USER}@${VPS_HOST}"
```

...
