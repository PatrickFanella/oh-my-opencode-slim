import { tool } from "@opencode-ai/plugin";
import { loadAccountsConfig, fetchAllQuotas, CONFIG_PATHS } from "./api";

/**
 * Compact quota display tool - groups by account, shows progress bars
 * 
 * Output format:
 * ```
 * user1    G3Pro [████████░░]  80%  2h | G3Flash [██████████] 100%  1h | Sonnet [████░░░░░░]  45%  3h
 * user2    G3Pro [░░░░░░░░░░]   0%  4h | G3Flash [███████░░░]  72%  1h | Sonnet [██████████] 100%  2h
 * ```
 */
export const antigravity_quota = tool({
  description: "Check Antigravity API quota for all accounts (compact view with progress bars)",
  args: {},
  async execute() {
    try {
      const config = await loadAccountsConfig();
      if (!config) {
        return `No accounts found. Checked:\n${CONFIG_PATHS.map((p) => `  - ${p}`).join("\n")}`;
      }

      // Create accounts with default emails if missing (don't mutate original)
      const accounts = config.accounts.map((acc, i) => ({
        ...acc,
        email: acc.email || `account-${i + 1}`,
      }));

      const results = await fetchAllQuotas(accounts);
      const errors: string[] = [];
      const lines: string[] = [];

      // Find the longest email for padding
      const maxEmailLen = Math.max(...results.map((r) => shortEmail(r.email).length), 6);

      for (const result of results) {
        if (!result.success) {
          errors.push(`${shortEmail(result.email)}: ${result.error}`);
          continue;
        }

        const email = shortEmail(result.email).padEnd(maxEmailLen);
        
        if (result.models.length === 0) {
          lines.push(`${email}  (no models)`);
          continue;
        }

        // Compact model display with progress bar: Name [████░░] XX% Xh
        const modelParts = result.models.map((m) => {
          const name = shortModelName(m.name).padEnd(7);
          const bar = progressBar(m.percent);
          const pct = m.percent.toFixed(0).padStart(3);
          return `${name} ${bar} ${pct}% ${m.resetIn.padEnd(4)}`;
        });

        lines.push(`${email}  ${modelParts.join(" | ")}`);
      }

      let output = "# Quota\n```\n";
      if (errors.length > 0) {
        output += `Errors: ${errors.join(", ")}\n\n`;
      }
      output += lines.join("\n");
      output += "\n```";

      return output;
    } catch (err) {
      return `Error: ${err instanceof Error ? err.message : String(err)}`;
    }
  },
});

// ASCII progress bar
function progressBar(percent: number): string {
  const width = 10;
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  return `[${"\u2588".repeat(filled)}${"\u2591".repeat(empty)}]`;
}

// Shorten email to username part
function shortEmail(email: string): string {
  return email.split("@")[0] ?? email;
}

// Shorten model names for compact display
function shortModelName(name: string): string {
  const lower = name.toLowerCase();
  
  // Common mappings
  if (lower.includes("claude") && lower.includes("sonnet")) return "Sonnet";
  if (lower.includes("claude") && lower.includes("opus")) return "Opus";
  if (lower.includes("claude") && lower.includes("haiku")) return "Haiku";
  if (lower.includes("claude")) return "Claude";
  
  if (lower.includes("gemini 3") && lower.includes("pro")) return "G3Pro";
  if (lower.includes("gemini 3") && lower.includes("flash")) return "G3Flash";
  if (lower.includes("gemini") && lower.includes("pro")) return "GemPro";
  if (lower.includes("gemini") && lower.includes("flash")) return "GemFlash";
  
  // Fallback: take first 8 chars
  return name.slice(0, 8);
}
