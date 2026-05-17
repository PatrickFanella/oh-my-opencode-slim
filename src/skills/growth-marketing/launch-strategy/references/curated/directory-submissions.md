# Directory Submissions

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `directory-submissions-skill.md`

_Source topic: directory-submissions_

**Purpose:** When the user wants to submit their product to startup, SaaS, AI, agent, MCP, no-code, or review directories for backlinks, domain rating, and discovery. Also use when the user mentions "directory submissions," "submit to directories," "backlinks from directories," "list my product," "submit to Product Hunt," "BetaList," "TAAFT," "Futurepedia," "G2 listing," "Capterra listing," "AlternativeTo," "SaaSHub," "AI directories," "MCP registry," "agent directory," "dofollow backlinks," "launch directories," or "directory tracker." Use this whenever someone is planning the directory layer of a product launch or an ongoing backlink campaign. For the broader launch moment, see launch-strategy. For programmatic SEO pages that should live behind these backlinks, see programmatic-seo. For AI citation optimization, see ai-seo.

# Directory Submissions

You are an expert in directory-driven distribution for software products. Your goal is to help the user build a compounding backlink + discovery foundation by submitting to the right directories, in the right order, with the right positioning — and to make sure that foundation actually produces leads instead of vanity backlinks.

## Before Starting

**Check for product marketing context first:**
If `.agents/product-marketing-context.md` exists (or `.claude/product-marketing-context.md` in older setups), read it before asking questions. Use that context and only ask for information not already covered or specific to this task.

## The Three Hard Rules

### Rule 1: Foundation before submission
- A single `<h1>` and sequential heading hierarchy — pages with clean hierarchy have **2.8× higher AI citation rates**, and 87% of ChatGPT-cited pages use a single H1.
- A real pricing page (even "free while in beta" counts — most Tier 1 directories require one).
- Privacy policy + terms.
- Logo assets in PNG + SVG + square 1024×1024 + favicon.
- 5–8 real product screenshots at 1920×1080 (not marketing mockups).
- A 60–90 second demo video — products with video on Product Hunt get **2.7× more upvotes**.
- FAQ schema markup (AI engines heavily weight `FAQPage` JSON-LD for answer extraction).
- Structured data: `Organization`, `Product`, `SoftwareApplication`.

### Rule 2: Destination pages before directories
- 3–5 competitor alternative pages (`/alternatives/[competitor]`) targeting "[competitor] alternative" keywords. Comparison/alternative pages convert at **5–15%** vs 0.5–2% for generic content.
- 3–5 use-case pages (`/for/[audience]` or `/use-cases/[use-case]`).
- Template gallery with 20+ entries (if applicable — this was Typeform's largest SEO growth driver, generating 30K non-branded signups and $3M/year LTV).
- 1 "best of" blog post you wrote yourself about your own category, including honest coverage of competitors.

### Rule 3: Positioning varies by directory type

| Surface | Lead with | Why |
|---|---|---|
| Startup directories | **Outcome** | Audience is other founders. They care what it does. |
| SaaS directories | **Alternative framing** | People search "[competitor] alternative" — meet them there. |
| AI directories | **AI-first architecture** | TAAFT/Futurepedia audiences explicitly want AI tools. |
| Agent/MCP directories | **Agent/MCP angle** | Niche but high-intent. A real moat. |
| No-code directories | **Ease + power** | Audience values speed-to-build over depth. |
...


### From `directory-list.md`

_Source topic: directory-list_

# Directory List — Full Reference
Canonical list of directories organized by tier. DR values are approximate and drift over time — verify via Ahrefs or Moz before building a plan around them.
**Column legend:**
- **DR** — Domain Rating (Ahrefs). Higher = more link equity passed.
- **Dofollow** — Whether the backlink passes SEO value. Nofollow listings still matter for referral traffic and brand signals.
- **Cost** — Free unless noted.
## Tier 2 — Startup / SaaS / Software Directories
Submit during launch week and continue rolling submissions thereafter.
| Directory | DR | Dofollow | Cost | Notes |
|---|---|---|---|---|
| **AlternativeTo** | 79 | Nofollow | Free | Massive SEO value despite nofollow. Submit as alternative to your top 4 competitors. |
| **SaaSHub** | 77 | Yes | Free | Ranks well for "[tool] alternatives" queries. High intent. |
| **G2** | 92 | Yes | Free listing | 10 reviews required for Grid appearance. Paid badges start at $2,999/yr. |
| **Capterra** | 93 | Yes | Free listing | Owned by G2 (acquired Feb 2026). Reviews drive everything. |
| **GetApp** | 78 | Yes | Free | Auto-syncs from Capterra in some cases. Owned by G2. |
| **SourceForge** | 92 | Yes | Free | Legacy but still high DR. Trivial to list. |
| **Slashdot** | ~88 | Yes | Free | Legacy but high DR. Company profile submission. |
| **Startup Stash** | ~50 | Yes | Free | Curated, organized by startup need. |
| **SideProjectors** | ~35 | Yes | Free | Discovery + marketplace. Community-driven. |
| **F6S** | 65 | Yes | Free | Startup platform used by accelerators. |
| **Stackshare** | ~60 | Yes | Free | Dev-centric. Show your tech stack. |
| **Resource.fyi** | ~40 | Yes | Free | Curated for designers/devs/marketers. |
| **Shipybara** | ~30 | Yes | Free | Shows which companies use your tool. |
| **TrustRadius** | 72 | Yes | Free | Smaller but respected B2B review platform. |
| **Crozdesk** | ~55 | Yes | Free | Feeds into Gartner ecosystem. |
## Tier 4 — AI Agent & MCP Server Registries
Relevant only if the product exposes agent capabilities or MCP servers. These are a real moat for AI-native tools — traditional SaaS products cannot list here.
| Directory | Category | Notes |
|---|---|---|
| **AI Agents List (aiagentslist.com)** | Agents | Hosts the 593+ MCP server directory. |
| **Glama.ai MCP servers** | MCP | 20K+ security-graded MCP servers. A/B/C/F grades matter — optimize for a good grade. |
| **APITracker MCP directory** | MCP | 110+ servers, 90 official integrations. |
| **Linux Foundation MCP Registry** | MCP | Canonical registry (PR-based submission, low volume but high signal). Anthropic donated MCP to LF in Dec 2025. |
| **AI Agent Store** | Agents | Compare agents, platforms, frameworks. |
| **AI Agents Base** | Agents | All-in-one directory. |
| **AI Agents Directory** | Agents | Specialized, updated daily. |
| **AI Agents Verse** | Agents | Curated directory. |
| **AgentHunter** | Agents | "Discover the best AI agents." |
| **Add AI Directory** | Agents | Catalogs agents + tools. |
| **AI Agents Live** | Agents | Discovery + sharing. |
| **AI Agents Marketplace** | Agents | Organized by 300+ human role equivalents. |
## Tier 6 — "Best of" Listicles (Editorial Outreach)
Not directories per se — these are blog posts on high-DR domains that you get included in via cold outreach. Often more valuable than directories because they combine a dofollow backlink with editorial trust + in-market buyer traffic + AI citation weight.
**Search patterns to find opportunities:**
- `"best [category] tools" 2026`
- `"best [competitor] alternative"`
- `"top AI [category]"`
- `"[category] tools review"`
**Outreach template (short):**
> Hey [name], saw your post on [best X tools]. We launched [product] recently — thought it might be worth a mention. Happy to give you a free account + credits for readers. Here's a 60s demo: [link]. No worries if not a fit.
**Target:** 10 inclusions in 30 days. Each = dofollow backlink from DR 40–70 + referral traffic + AI citation fuel.
## Verification
After any submission goes live, verify the backlink exists and is dofollow. You can:
1. **Manual:** Open the listing, right-click your product link, "Inspect" → check for `rel="nofollow"` or `rel="ugc"`. If absent, the link is dofollow.
2. **curl:** `curl -sIL https://directory.com/your-listing | grep -i link`

### From `positioning-variations.md`

_Source topic: positioning-variations_

# Positioning Variations Library

Directory audiences respond to different framings. Never copy-paste the same description everywhere — AI engines penalize duplicate content, and each directory type rewards a different opener.

Use this library to generate per-tier variants. Swap `[product]`, `[category]`, `[competitors]`, `[use-case]`, and `[audience]` with the real values.

## Template: Startup / Launch Directories

> The [differentiator] way to [outcome] for [audience].

> [Outcome-focused one-liner with product name]

> [Product] is the easiest way to [outcome] for [audience]. Built for teams who [pain point], [product] removes [friction] by [how].
>
> Unlike [competitor category], [product] [key differentiator 1] and [key differentiator 2]. You can [action 1] in under [timeframe], [action 2] without [limitation], and [action 3] that would normally require [cost or technical skill].
>
> We built [product] because [founder origin story in one sentence]. It's now used by [audience examples] to [use case examples].
>
> Try it free at [url]. No credit card, no setup.

**Tags:** [product category], [audience type], [use case 1], [use case 2], [differentiator], [tech]

## Template: AI Directories

> AI-powered [category] for [audience].

> [Product] is an AI-powered [category] that [core AI capability]. It uses [specific models / techniques] to [outcome] — so [audience] can [job to be done] in a fraction of the time.
>
> What makes it AI-first:
> • [AI feature 1] — [what it does] using [model/approach]
> • [AI feature 2] — [what it does]
> • [AI feature 3] — [what it does]
> • [AI feature 4] — [what it does]
>
> [Product] is built on [tech stack] and supports [models/providers]. Use cases: [use case 1], [use case 2], [use case 3], [use case 4].
>
...
