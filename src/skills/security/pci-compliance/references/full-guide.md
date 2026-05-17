# PCI Compliance (Full Guide)

Practical PCI DSS implementation guidance for payment systems and cardholder data.

## When to Use

- Building payment flows
- Handling cardholder data (CHD)
- Preparing SAQ/ROC evidence
- Reducing PCI scope through architecture

## PCI DSS Requirement Families (12)

## Build and maintain secure network

1. Firewall/network controls
2. No vendor-default credentials

## Protect cardholder data

3. Protect stored CHD
4. Encrypt CHD transmission over public networks

## Vulnerability management

5. Malware protection
6. Secure system/application maintenance

## Access control

7. Need-to-know access
8. Unique identity + authentication
9. Physical access restrictions

## Monitoring and testing

10. Log/monitor access to network + CHD
11. Regular security testing

## Security policy

12. Maintain organization-wide security policy

## Transaction Volume Levels (High Level)

- **Level 1**: > 6M transactions/year
- **Level 2**: 1M–6M/year
- **Level 3**: 20k–1M e-commerce/year
- **Level 4**: < 20k e-commerce or < 1M total/year

Exact obligations depend on brand/acquirer requirements.

## Data Minimization Rules

## Never store

- Full track data
- CVV/CVC/CVV2
- PIN/PIN block

## Can store (if protected)

- PAN
- Cardholder name
- Expiration date
- Service code

### Sanitization pattern

```python
def sanitize_log(data: dict) -> dict:
    sanitized = data.copy()
    if "card_number" in sanitized:
        card = sanitized["card_number"]
        sanitized["card_number"] = f"{card[:6]}{'*' * (len(card) - 10)}{card[-4:]}"
    for field in ("cvv", "cvv2", "cvc", "pin"):
        sanitized.pop(field, None)
    return sanitized
```

## Tokenization First Strategy

Use processor-side tokenization so your backend never receives raw PAN/CVV.

```javascript
// Frontend example (processor SDK)
const { token, error } = await stripe.createToken(cardElement)
// send token.id to backend, not card details
```

Server-side charge with token:

```python
charge = stripe.Charge.create(
    amount=amount,
    currency="usd",
    source=token_id,
)
```

Persist only token/customer references, not card values.

## Custom Token Vault (Only If Necessary)

If business requires in-house token vault:

- Strong encryption at rest
- Strict key management/rotation
- Segmentation and hardened access controls
- Heavy audit and compensating controls

```python
token = secrets.token_urlsafe(32)
encrypted = cipher.encrypt(json.dumps(card_data).encode())
vault[token] = encrypted
```

## Encryption Controls

## At rest

- Use modern AEAD modes (e.g., AES-256-GCM).
- Separate key management from data store.

```python
nonce = os.urandom(12)
ciphertext = AESGCM(key).encrypt(nonce, plaintext.encode(), None)
```

## In transit

- Enforce TLS 1.2+ end-to-end.
- Secure cookies/headers for web apps.

## Access Control and Auditing

- Least privilege by role (business need-to-know)
- MFA for administrative/sensitive access
- Immutable/append-only audit logging where possible
- Log auth attempts and CHD resource access

Example gate:

```python
if 'pci_access' not in user_roles:
    return {'error': 'Unauthorized'}, 403
```

## Input Validation

- Normalize and validate PAN format before processor submission
- Use Luhn validation as sanity check (not sufficient alone)
- Reject malformed payloads early

## SAQ Paths (Simplified)

- **SAQ A**: hosted payment page, no CHD in your systems
- **SAQ A-EP**: e-commerce site influences payment page context
- **SAQ D**: store/process/transmit CHD directly (highest burden)

## Implementation Checklist

## Scope and architecture

- [ ] CHD dataflow + CDE boundaries documented
- [ ] Scope reduction opportunities implemented

## Data protection

- [ ] No prohibited data storage
- [ ] PAN masked in display/logging
- [ ] PAN encrypted where stored
- [ ] Key management process documented

## Network and platform

- [ ] Segmentation/firewall controls in place
- [ ] Default creds removed and hardened baselines applied
- [ ] Patch/vulnerability process active

## Access and monitoring

- [ ] RBAC + unique IDs + MFA
- [ ] CHD access logging and review process
- [ ] File integrity/security testing schedule defined

## Policy and response

- [ ] Security policy maintained
- [ ] Incident response plan covers payment compromise scenarios
- [ ] Security awareness training includes PCI handling duties

## Critical Caveats

- PCI is not “one-time pass”; controls must operate continuously.
- Card-brand/acquirer obligations can exceed baseline summaries here.
- Engage QSA/compliance/legal for formal assessment interpretation.
