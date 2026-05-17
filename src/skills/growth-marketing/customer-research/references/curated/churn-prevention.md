# Churn Prevention

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `churn-prevention-skill.md`

_Source topic: churn-prevention_

**Purpose:** When the user wants to reduce churn, build cancellation flows, set up save offers, recover failed payments, or implement retention strategies. Also use when the user mentions 'churn,' 'cancel flow,' 'offboarding,' 'save offer,' 'dunning,' 'failed payment recovery,' 'win-back,' 'retention,' 'exit survey,' 'pause subscription,' 'involuntary churn,' 'people keep canceling,' 'churn rate is too high,' 'how do I keep users,' or 'customers are leaving.' Use this whenever someone is losing subscribers or wants to build systems to prevent it. For post-cancel win-back email sequences, see email-sequence. For in-app upgrade paywalls, see paywall-upgrade-cro.

# Churn Prevention

You are an expert in SaaS retention and churn prevention. Your goal is to help reduce both voluntary churn (customers choosing to cancel) and involuntary churn (failed payments) through well-designed cancel flows, dynamic save offers, proactive retention, and dunning strategies.

## Before Starting

**Check for product marketing context first:**
If `.agents/product-marketing-context.md` exists (or `.claude/product-marketing-context.md` in older setups), read it before asking questions. Use that context and only ask for information not already covered or specific to this task.

### 1. Current Churn Situation
- What's your monthly churn rate? (Voluntary vs. involuntary if known)
- How many active subscribers?
- What's the average MRR per customer?
- Do you have a cancel flow today, or does cancel happen instantly?

### 2. Billing & Platform
- What billing provider? (Stripe, Chargebee, Paddle, Recurly, Braintree)
- Monthly, annual, or both billing intervals?
- Do you support plan pausing or downgrades?
- Any existing retention tooling? (Churnkey, ProsperStack, Raaft)

### 3. Product & Usage Data
- Do you track feature usage per user?
- Can you identify engagement drop-offs?
- Do you have cancellation reason data from past churns?
- What's your activation metric? (What do retained users do that churned users don't?)

### 4. Constraints
- B2B or B2C? (Affects flow design)
- Self-serve cancellation required? (Some regulations mandate easy cancel)
- Brand tone for offboarding? (Empathetic, direct, playful)

## Cancel Flow Design

### The Cancel Flow Structure

...


### From `cancel-flow-patterns.md`

_Source topic: cancel-flow-patterns_

# Cancel Flow Patterns
Detailed cancel flow patterns by business type, billing provider, and industry.
### B2B / Team Plans
Lower volume, higher stakes. Personal outreach is worth the cost.
**Flow structure:**
```
Cancel button → Exit survey → Offer (or route to CS) → Confirm → Post-cancel
```
**Characteristics:**
- Route accounts above MRR threshold to customer success
- Show team impact ("Your 8 team members will lose access")
- Offer admin-to-admin call for enterprise accounts
- Longer consideration — allow "schedule a call" as a save option
- Require admin/owner role to cancel (not any team member)
**Typical save rate:** 30-45% (higher because of personal touch)
**MRR-based routing:**
| Account MRR | Cancel Flow |
|-------------|-------------|
| <$100/mo | Automated flow with offers |
| $100-$500/mo | Automated + flag for CS follow-up |
| $500-$2,000/mo | Route to CS before cancel completes |
| $2,000+/mo | Block self-serve cancel, require CS call |
## Cancel Flow by Billing Interval
### Monthly Subscribers
- More price-sensitive, shorter commitment
- Discount offers work well (20-30% for 2-3 months)
- Pause is effective (1-2 months)
- Suggest annual plan at a discount as an alternative
**Offer priority:**
1. Discount (if reason = price)
2. Pause (if reason = not using / temporary)
3. Annual plan switch (if engaged but price-sensitive)
### Annual Subscribers
- Higher commitment, often cancelling for stronger reasons
- Prorate refund expectations matter
- Longer save window (they've already paid)
- Personal outreach more justified (higher LTV at stake)
**Offer priority:**
1. Pause remainder of term (if temporary)
2. Plan adjustment + credit for next renewal
3. Personal outreach from CS
4. Partial refund + downgrade (better than full refund + cancel)
**Refund handling:**
- Offer prorated refund if significant time remaining
- "Pause until renewal" if less than 3 months left
- Be generous — bad refund experiences create vocal detractors
## Post-Cancel Experience
What happens after cancel matters for:
- Win-back potential
- Word of mouth
- Review sentiment
### Confirmation Page
```
Your subscription has been cancelled.
What happens next:

### From `dunning-playbook.md`

_Source topic: dunning-playbook_

# Dunning Playbook
Complete guide to recovering failed payments and reducing involuntary churn.
## The Dunning Timeline
```
Day -30 to -7: Pre-dunning (prevent failures)
Day 0:         Payment fails → Smart retry #1 + Email #1
Day 1-3:       Smart retry #2 + Email #2
Day 3-5:       Smart retry #3
Day 5-7:       Smart retry #4 + Email #3
Day 7-10:      Final retry + Email #4 (final warning)
Day 10-14:     Grace period ends → Account paused/cancelled
Day 14+:       Win-back sequence begins
```
## Smart Retry Strategy
### Decline Type Classification
| Code | Type | Meaning | Retry? |
|------|------|---------|--------|
| `insufficient_funds` | Soft | Temporarily low balance | Yes — retry in 2-3 days |
| `card_declined` (generic) | Soft | Various temporary reasons | Yes — retry 3-4 times |
| `processing_error` | Soft | Gateway/network issue | Yes — retry within 24h |
| `expired_card` | Hard | Card is expired | No — request new card |
| `stolen_card` | Hard | Card reported stolen | No — request new card |
| `do_not_honor` | Soft/Hard | Bank refused (ambiguous) | Try once more, then ask for new card |
| `authentication_required` | Auth | SCA/3DS needed | Send customer to authenticate |
### Retry Schedule by Provider
**Stripe (Smart Retries — recommended):**
- Enable "Smart Retries" in Stripe Dashboard → Billing → Settings
- Stripe's ML model picks optimal retry timing based on billions of transactions
- Typically 4-8 retry attempts over 3-4 weeks
- Recovers ~15% more than fixed-schedule retries
**Manual retry schedule (if no smart retries):**
| Retry | Timing | Best Day/Time |
|-------|--------|--------------|
| 1 | Day 1 (24h after failure) | Morning, same day of week as original |
| 2 | Day 3 | Try a different time of day |
| 3 | Day 5 | After typical payday (1st, 15th) |
| 4 | Day 7 | Morning of the next business day |
| 5 (final) | Day 10 | Last attempt before grace period ends |
**Retry timing insights:**
- Retry on the same day of month the original payment succeeded
- Retry after common paydays (1st and 15th of the month)
- Avoid retrying on weekends (lower approval rates)
- Morning retries (8-10am local time) perform slightly better
## Grace Period Management
### What Happens During Grace Period
| Setting | Recommendation |
|---------|---------------|
| Duration | 7-14 days after final retry |
| Access | Degraded (read-only) or full access |
| Visibility | In-app banner: "Payment past due — update to continue" |
| Retry | Continue background retries during grace |
| Communication | Dunning emails continue |
### Access Degradation Options
**Option A: Full access during grace (recommended for B2B)**
- Lower friction, customer feels respected
