# Web Search Brave

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Extracted Resources

- `scripts/web-search-brave/`

## Guidance

### From `web-search-brave-skill.md`

_Source topic: web-search-brave_

**Purpose:** Search the web using Brave Search API for fast, privacy-respecting results with localization, freshness filtering, and extra snippets. Use when you need web search results with country/language targeting or time-based filtering. Requires BRAVE_API_KEY. Keywords: brave, web search, localized search, privacy search, freshness filtering.

# Web Search (Brave Search API)

Search the web using Brave's Search API. Returns web results with descriptions, optional extra snippets, and support for country/language targeting.

**Note:** This skill requires a Brave Search API key. For basic web search using the agent's built-in capability, see `web-search`. For AI-optimized results with relevance scores, see `web-search-tavily`.

## When to Use This Skill

Use this skill when:
- You need to find current information not in your training data
- The user asks about recent events, news, or updates
- You need localized search results for a specific country or language
- You want a privacy-respecting search alternative
- Research requires real-time web data
- Keywords mentioned: search, look up, find online, current, latest, news

Do NOT use this skill when:
- Information is already in your knowledge base and doesn't need verification
- The user asks about historical facts that don't change
- You're working with local files or code (use other tools)
- A more specific skill exists for the task (e.g., documentation lookup)
- You need AI-generated answer summaries (use `web-search-tavily` instead)

## Prerequisites

- **BRAVE_API_KEY** environment variable is set with a valid API key
- **Deno** is installed (for running the search script)
- **Internet access** is available

## Quick Start

```bash
deno run --allow-env --allow-net=api.search.brave.com scripts/search.ts "your search query"
```

Example with freshness filter:
...
