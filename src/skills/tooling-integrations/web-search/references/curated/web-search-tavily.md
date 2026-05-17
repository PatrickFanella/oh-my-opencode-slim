# Web Search Tavily

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Extracted Resources

- `scripts/web-search-tavily/`

## Guidance

### From `web-search-tavily-skill.md`

_Source topic: web-search-tavily_

**Purpose:** Search the web using Tavily API for high-quality, AI-optimized results with advanced filtering options. Use when you need structured search results, domain filtering, relevance scores, or AI-generated answer summaries. Requires TAVILY_API_KEY. Keywords: tavily, advanced search, filtered search, domain filtering, relevance scoring.

# Web Search (Tavily API)

Search the web using Tavily's AI-optimized search API. Returns high-quality, structured results with relevance scores and optional AI-generated summaries.

**Note:** This skill requires a Tavily API key. For basic web search using the agent's built-in capability, see `web-search`.

## When to Use This Skill

Use this skill when:
- You need to find current information not in your training data
- The user asks about recent events, news, or updates
- You need to verify facts or find authoritative sources
- Research requires real-time web data
- Keywords mentioned: search, look up, find online, current, latest, news

Do NOT use this skill when:
- Information is already in your knowledge base and doesn't need verification
- The user asks about historical facts that don't change
- You're working with local files or code (use other tools)
- A more specific skill exists for the task (e.g., documentation lookup)

## Prerequisites

- **TAVILY_API_KEY** environment variable is set with a valid API key
- **Deno** is installed (for running the search script)
- **Internet access** is available

## Quick Start

```bash
deno run --allow-env --allow-net=api.tavily.com scripts/search.ts "your search query"
```

Example with AI-generated answer:

```bash
deno run --allow-env --allow-net=api.tavily.com scripts/search.ts "React 19 new features" --answer
```

## Script Usage
...

# Exclude social media
scripts/search.ts "AI news" --exclude twitter.com,reddit.com
```

## Output Format

### Human-Readable Output (default)

```

1. React 19 Release Notes

2. What's New in React 19
   https://example.com/react-19-features
```

### JSON Output (--json)

```json
```

### Result Fields

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Page title |
| `url` | string | Source URL |
| `content` | string | Relevant excerpt from the page |
| `score` | number | Relevance score (0-1, higher is better) |
| `published_date` | string | Publication date (if available) |
| `raw_content` | string | Full page content (only with --raw) |

## Examples

### Example 1: Current Events Search

**Scenario**: Find recent news about a technology topic

```bash
...
