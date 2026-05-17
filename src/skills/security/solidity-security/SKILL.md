---
name: solidity-security
description: Master smart contract security best practices to prevent common vulnerabilities and implement secure Solidity patterns. Use when writing smart contracts, auditing existing contracts, or implementing security measures for blockchain applications.
---

# Solidity Security

Use secure Solidity patterns to prevent critical exploits in production contracts.

## When to Use This Skill

- Writing or refactoring smart contracts with funds/state risk
- Security-reviewing DeFi/NFT/token/proxy contracts
- Building audit-prep checklist before external audit
- Hardening permissioning, transfer flow, and upgrade paths

## Activation Inputs (ask first)

- Solidity version + compiler settings
- Protocol type (vault, AMM, lending, NFT, governance, bridge)
- Trust assumptions (admin keys, oracle model, external contracts)
- Upgrade pattern (none/UUPS/transparent/diamond)
- Test stack (Foundry/Hardhat) and fuzz/invariant coverage status

## Core Security Workflow

1. **Threat map critical state**
   - Identify value-bearing flows, privileged actions, and external call edges.

2. **Block top exploit classes first**
   - Reentrancy: CEI + `nonReentrant` where needed.
   - Access control: explicit roles/owner constraints.
   - Input/state validation on all external/public entry points.
   - Avoid unsafe external call assumptions.

3. **Use battle-tested primitives**
   - Prefer OpenZeppelin modules (`Ownable`, `AccessControl`, `Pausable`, `ReentrancyGuard`).
   - Use Solidity `^0.8.x` checked arithmetic unless justified `unchecked` block.

4. **Design for failure + incident response**
   - Add pause/emergency controls for blast-radius reduction.
   - Ensure predictable revert reasons for monitoring and ops.

5. **Test like attacker**
   - Unit + invariant + fuzz tests for economic/security invariants.
   - Simulate malicious callback contracts and privilege abuse.

## Minimum Security Checklist

- Reentrancy protection on value transfer/external-call paths
- Strict role/ownership controls on admin functions
- No `tx.origin` auth; use `msg.sender`
- No delegatecall to untrusted targets
- Input checks on addresses, amounts, and state transitions
- Pull-over-push payout pattern for multi-recipient flows
- Pause/kill-switch design for critical operations
- Event coverage for sensitive changes

## Guardrails

- Do not trade away security for tiny gas wins.
- Do not ship unaudited upgrade/admin backdoors.
- Do not assume mempool privacy; evaluate front-running risk.
- Do not skip invariant tests for core accounting logic.

## Done Criteria

- Core exploit classes reviewed and mitigated
- Security-focused tests passing (incl. adversarial cases)
- Privileged paths documented and constrained
- Emergency controls validated in tests
- Ready package for external audit (threat model + assumptions + tests)

## Resources

- `references/full-guide.md` — detailed vulnerability patterns, secure code examples, gas+security tradeoffs, and audit prep material.

### Curated references

Former merged-skill dumps were distilled into these lookup files:

- `references/curated/defi-protocol-templates.md` — Defi Protocol Templates guidance.
- `references/curated/nft-standards.md` — Nft Standards guidance.
