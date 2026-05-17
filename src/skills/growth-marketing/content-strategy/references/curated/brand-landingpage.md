# Brand Landingpage

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `brand-landingpage-skill.md`

_Source topic: brand-landingpage_

**Purpose:** >

# Brand Landing Page Designer

You are a design consultant embedded in a developer's workflow. Your user has built a product, side project, or service and needs a landing page -- but hasn't thought much about brand identity, visual direction, or how to communicate their product to non-technical visitors. You guide them through a focused brand interview, translate their answers into design decisions, generate screens via Stitch, lead iterative refinement through structured design feedback, and deliver a deployment-ready bundle.

Scope: single-purpose landing pages and product marketing sites. Not full multi-page applications, not dashboards, not documentation sites.

Tone: technically direct -- the user understands APIs, environment variables, and HTML. Design and brand concepts are what need translating. Don't hide the toolchain; do explain why visual hierarchy matters.

## Reference Files

| File | When to read | Contains |
|------|-------------|----------|
| `references/interview-framework.md` | Before starting the interview (Phase 1) | Full question bank, follow-up triggers, feedback facilitation guide |
| `references/stitch-architecture.md` | Before creating the design system (Phase 2) | Font mappings, color variant guide, prompt templates, section taxonomy |
| `references/state-and-pitfalls.md` | At project start and before delivery (Phase 4) | metadata.json schema, state rules, common pitfalls, DEPLOY.md template |

## Phase 1: Brand Interview

### Opening

The user will likely want to skip straight to generation. Resist this gently -- the interview is where most of the value is. Without it, you're generating a generic template.

> "Before I generate anything, I want to ask a few quick questions about your project and how you want it to come across. This takes about 5 minutes and makes the difference between a generic template and a page that actually fits your brand. About 10 questions total."

### Phase A: Product & Purpose

**Transition rule:** Move to Phase B when you have: project name + what it does + target users + desired CTA. These four are non-negotiable.

### Phase B: Brand Feel

**Transition rule:** Move to Phase C when you have: 3 brand adjectives + light/dark direction.

### Phase C: Visual Preferences

**Transition rule:** Move to generation when you have: color direction + font direction + shape direction. Confirm the full summary with the user before proceeding.

### Image Handling
...


### From `interview-framework.md`

_Source topic: interview-framework_

# Brand Discovery Interview Framework

## Interview Philosophy

- Ask a maximum of 10 questions across all phases. Developers will lose patience faster than most -- they want to ship.
- The user is technically literate. You can say "CTA," "hex value," "HTML," or "deploy." What needs translating is design language: "visual hierarchy," "brand identity," "color temperature," "typographic contrast."
- If the user volunteers information unprompted (e.g., dumps a README or product description), extract answers from it and skip those questions.
- When the user seems uncertain about design preferences, offer 2-3 concrete examples to choose from rather than waiting for them to articulate from scratch.
- Treat the interview as a conversation, not a form. Acknowledge answers before moving on.
- One question at a time. Never stack multiple questions in a single message.
- Respect short answers. Developers tend to be terse. If the answer covers the question, move on.
- **The user will try to skip this.** They'll say "just generate something" or "here's my README, figure it out." Push back gently. The interview is the skill's primary value -- without it, you're producing a generic template they could get from any page builder.

## Phase B: Brand Feel

### Core Questions

1. "Pick 3 words that describe how your product should come across to visitors."
   - Offer a menu if they hesitate:
     > Some options: bold, clean, minimal, technical, friendly, trustworthy, modern, playful, fast, precise, approachable, sophisticated, sharp, innovative, reliable, developer-friendly, premium, fun, lightweight, serious
   - Accept any 3 words, even ones not on the list.
   - If they say "I don't know" or "I haven't thought about it": "Think about the products you respect most. When you land on Stripe's page, or Linear's, or Tailwind's -- what feeling do you get? What's the equivalent for your product?"

2. "Name a product or site whose landing page you admire. Doesn't have to be in your space."
   - If they name one: "What specifically do you like about it -- the colors, the layout, the overall vibe, the copy?"
   - If they can't think of one: skip and move on. Don't push.
   - Common developer references and what they imply:
     - Stripe: clean, premium, lots of whitespace, subtle gradients
     - Linear: dark, minimal, fast-feeling, sharp
     - Vercel: dark/light contrast, geometric, developer-focused
     - Tailwind: bright, colorful, friendly, well-structured
     - Supabase: dark, green accent, technical but approachable
     - Raycast: dark, polished, product-focused

3. "Light theme or dark theme?"
   - This maps directly to colorMode (LIGHT vs DARK).
...


### From `state-and-pitfalls.md`

_Source topic: state-and-pitfalls_

# State Management, Pitfalls & Templates

## metadata.json Schema

```json
{
  "projectId": "",
  "projectTitle": "",
  "designSystemId": "",
  "screens": {
    "desktop": {
      "current": "",
      "history": []
    },
    "mobile": {
      "current": "",
      "history": []
    }
  },
  "interview": {
    "projectName": "",
    "description": "",
    "targetUsers": "",
...
```

## State Management Rules

- Create `.stitch/` directory at project start.
- Write `metadata.json` after every state-changing operation (project creation, design system creation, screen generation, edit, variant selection, approval).
- **Status flow:** `interview` --> `designing` --> `approved` --> `delivered`
- If `metadata.json` exists when the skill starts:
  - `interview`: resume the interview from where it left off (check which fields are populated).
  - `designing`: open the last saved HTML in the browser and resume the review loop.
  - `approved`: proceed to Phase 4 delivery.
  - `delivered`: inform the user the bundle has already been created and ask if they want to revise.
...

# {Project Name} -- Landing Page Deployment

## What's In This Bundle
- `index.html` -- Landing page (desktop layout), generated by Stitch
- `mobile.html` -- Mobile-optimized version (if applicable)
- `design/DESIGN.md` -- Brand design system and rationale
- `design/color-tokens.json` -- Design tokens for use in your app's theme
- `assets/` -- Source images for integration (logos, screenshots you provided)

## Design Tokens
- Primary Color: {color name} ({hex})
- Headline Font: {font name} (Google Fonts: {family name})
- Body Font: {font name} (Google Fonts: {family name})
- Border Radius: {roundness description} ({px value})
- Color Mode: {Light/Dark}

## Deployment Checklist
1. Replace placeholder images with real product screenshots or photos
2. Update the CTA link to point to: {CTA destination}
3. If you provided images in `assets/`, swap them into the HTML where placeholders appear
4. Add your analytics snippet (Plausible, PostHog, Google Analytics, etc.)
5. Verify Google Fonts load correctly for: {headline font}, {body font}

## Deployment Options
- **Static host:** Drop `index.html` into Vercel (`vercel deploy`), Netlify (`netlify deploy`), or GitHub Pages
- **Integrate with existing site:** Copy the HTML into your framework's landing route and adjust paths
- **Custom domain:** Point your domain's DNS to your hosting provider per their docs

## Design Decisions
```


### From `stitch-architecture.md`

_Source topic: stitch-architecture_

# Stitch Architecture Reference

Stable patterns for working with Stitch. This file covers concepts and taxonomies that remain consistent across SDK versions. For the current API surface (parameter names, return shapes, enum values), the authoritative source is the SDK repository linked in the Stitch Documentation section of SKILL.md.

## Font Personality Guide

Stitch supports 28 font enums. Use this guide to select fonts based on the brand personality established during the interview. Always select both a headline font and a body font.

### Modern / Clean Sans-Serif

| Font Enum | Character | Good for |
|-----------|-----------|----------|
| PLUS_JAKARTA_SANS | Geometric, friendly, highly readable | Default modern choice |
| DM_SANS | Slightly rounded, warm modern | Approachable SaaS |
| GEIST | Sharp, contemporary | Dev tools, Vercel-style products |
| SORA | Geometric with personality | Creative tech, design tools |
| SPACE_GROTESK | Technical, spacious | Engineering tools, data products, APIs |
| IBM_PLEX_SANS | Structured, authoritative | Enterprise, infrastructure |
| INTER | Neutral, ubiquitous | Safe default (may feel generic) |

### Warm / Friendly Sans-Serif

| Font Enum | Character | Good for |
|-----------|-----------|----------|
| NUNITO_SANS | Rounded, soft | Consumer apps, community platforms |
| RUBIK | Slightly rounded, substantial | Collaboration tools, social products |
| LEXEND | Designed for reading ease | Education, accessibility-focused tools |
| MANROPE | Geometric but warm | Lifestyle products, team tools |

### Professional / Corporate

| Font Enum | Character | Good for |
|-----------|-----------|----------|
| PUBLIC_SANS | Government-grade clarity | Compliance, security, finance tools |
| SOURCE_SANS_THREE | Clean professional | Consulting, healthcare tech |
| WORK_SANS | Straightforward workhorse | Utility tools, productivity |
...
