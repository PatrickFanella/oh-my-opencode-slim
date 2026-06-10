# Editable Skill Assignments

Edit this document and send it back with your changes. The `skillProfiles`
object below mirrors the current default skill assignment shape:

- `global`: skills every non-internal agent receives by default.
- `agents.<name>`: skills added only to that agent.
- Effective skills for an agent are `global + agents.<name>` with duplicates
  removed.
- `councillor` is an internal council worker and receives no default skills.
- `observer` is disabled by default, but if enabled it receives `global` skills
  unless explicitly overridden.

```jsonc
{
  "skillProfiles": {
    "global": [
      "agent-browser",
      "cartography",
      "caveman",
      "clonedeps",
      "context-engineer",
      "deep-research",
      "github-pro",
      "humanizer",
      "obsidian-cli",
      "omarchy",
      "prompt-craft",
      "refactor",
      "review-doc-consistency",
      "review-quality",
      "scheduled-tasks",
      "screenshot",
      "session-handoff",
      "simplify",
      "skills-cli",
      "summarization",
      "systematic-debugging",
      "web-search",
      "writing-plans"
    ],
    "agents": {
      "council": [
        "architecture-patterns",
        "blind-spot-detective",
        "competitive-landscape",
        "data-storytelling",
        "fact-check",
        "good-thinking",
        "improve-codebase-architecture",
        "marketing-psychology",
        "multi-reviewer-patterns",
        "naming",
        "security-threat-model",
        "story-sense",
        "technology-impact",
        "worldbuilding",
        "copywriting",
        "social-content"
      ],
      "councillor": [],
      "designer": [
        "copywriting",
        "develop-web-game",
        "frontend-design",
        "game-design-theory",
        "image",
        "marketing-psychology",
        "neubrutal-hud",
        "opentui",
        "page-cro",
        "presentation-design",
        "react-native-pro",
        "react-pro",
        "subcult-visual-design",
        "use-my-browser",
        "video",
        "vscode-ext-commands",
        "vscode-ext-localization",
        "wcag-audit-patterns",
        "webapp-testing",
        "stripe-integration",
        "typescript-pro",
        ""
      ],
      "explorer": [
        "binary-analysis-patterns",
        "claim-investigation",
        "competitive-landscape",
        "competitor-profiling",
        "customer-research",
        "fact-check",
        "hads",
        "postgres-pro",
        "protocol-reverse-engineering",
        "security-ownership-map"
      ],
      "fixer": [
        "api-design-principles",
        "auth-implementation-patterns",
        "bash-defensive-patterns",
        "bats-testing-patterns",
        "cli-developer",
        "database-migration",
        "develop-userscripts",
        "develop-web-game",
        "golang-pro",
        "hybrid-search-implementation",
        "llm-evaluation",
        "mcp-builder",
        "neubrutal-hud",
        "nodejs-backend-patterns",
        "opentui",
        "postgres-data-quality",
        "postgres-pro",
        "python-configuration",
        "python-testing-patterns",
        "python-tooling-patterns",
        "rag-implementation",
        "rust-pro",
        "shellcheck-configuration",
        "stripe-integration",
        "tdd",
        "temporal-python-testing",
        "typescript-pro",
        "uv-package-manager",
        "webapp-testing",
        "websocket-engineer",
        "workflow-orchestration-patterns"
      ],
      "librarian": [
        "claim-investigation",
        "competitive-landscape",
        "competitor-profiling",
        "content-strategy",
        "customer-research",
        "doc",
        "ebook-analysis",
        "fact-check",
        "hads",
        "openai-docs",
        "opensource-guide-coach",
        "pdf",
        "readme-i18n",
        "seo-pro",
        "spreadsheet"
      ],
      "observer": [],
      "oracle": [
        "almaz",
        "api-design-principles",
        "architecture-patterns",
        "auth-implementation-patterns",
        "binary-analysis-patterns",
        "cqrs-implementation",
        "database-migration",
        "dependency-upgrade",
        "distributed-tracing",
        "gitea-repo-overhaul",
        "git-advanced-workflows",
        "homelab",
        "hybrid-search-implementation",
        "improve-codebase-architecture",
        "multi-reviewer-patterns",
        "nodejs-backend-patterns",
        "nuc",
        "postgres-data-quality",
        "postgres-pro",
        "protocol-reverse-engineering",
        "sast-configuration",
        "secrets-management",
        "security-best-practices",
        "security-ownership-map",
        "security-threat-model",
        "slo-implementation",
        "workflow-orchestration-patterns"
      ],
      "orchestrator": [
        "almaz",
        "changelog-automation",
        "customize-opencode",
        "dependency-upgrade",
        "gitea-repo-overhaul",
        "good-thinking",
        "hads",
        "homelab",
        "mcp-builder",
        "neubrutal-hud",
        "nuc",
        "observe-and-tune",
        "opensource-guide-coach",
        "parallel-feature-development",
        "requirements-interview",
        "setup-matt-pocock-skills",
        "skill-creator",
        "super-productivity-maintenance",
        "super-productivity-planning",
        "team-communication-protocols",
        "team-composition-patterns",
        "triage"
      ]
    }
  }
}
```

## Optional Per-Agent Hard Override Format

If you want one specific agent to ignore `global + agents.<name>`, use an
agent-level `skills` override in config instead:

```jsonc
{
  "agents": {
    "oracle": {
      "skills": ["review-quality", "security-threat-model"]
    }
  }
}
```
