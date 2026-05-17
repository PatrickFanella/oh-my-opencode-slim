---
name: pci-compliance
description: Implement PCI DSS compliance requirements for secure handling of payment card data and payment systems. Use when securing payment processing, achieving PCI compliance, or implementing payment card security measures.
---

# PCI Compliance

Purpose: implement PCI DSS-aligned controls for cardholder data handling and payment flows.

## Use When

- Building/changing payment systems
- Handling PAN/tokenized payment artifacts
- Reducing PCI scope and preparing assessments
- Implementing encryption/access/audit controls around CHD

## Don’t Use When

- You do not touch payment/card data paths
- You need legal interpretation only (engage compliance/legal team)

## Workflow

1. **Scope first**
   - Identify CHD flow, storage points, connected systems, and SAQ/ROC path.
2. **Eliminate raw card handling where possible**
   - Prefer hosted fields/tokenization by PCI-compliant processor.
3. **Enforce data minimization**
   - Never store CVV, full track data, PIN/PIN block.
4. **Apply core controls**
   - Encryption (at rest/in transit), RBAC/MFA, secure logging, vuln mgmt.
5. **Implement monitoring and evidence collection**
   - Audit trails, access logs, config/change history.
6. **Validate against requirement set**
   - Map controls to PCI DSS requirements and SAQ type.

## Output Checklist

- [ ] CHD/CDE scope diagram and data flow documented
- [ ] Processor tokenization used for payment capture where feasible
- [ ] Prohibited authentication data storage blocked (CVV/track/PIN)
- [ ] PAN masking/encryption controls implemented and tested
- [ ] TLS enforced for all card-related transport paths
- [ ] Access restricted by role + strong auth + audit logging
- [ ] Vulnerability scanning/patch and security test cadence defined
- [ ] SAQ type identified (A / A-EP / D) with evidence list

## Guardrails

- Keep secrets/keys out of source control
- Treat logs as sensitive: mask PAN, remove prohibited fields
- If uncertain, choose lower data exposure architecture (hosted/tokenized)

## Resources

- Full guide: `references/full-guide.md`
