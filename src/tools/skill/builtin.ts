import type { SkillDefinition } from "./types";

const playwrightSkill: SkillDefinition = {
  name: "playwright",
  description:
    "MUST USE for any browser-related tasks. Browser automation via Playwright MCP - verification, browsing, information gathering, web scraping, testing, screenshots, and all browser interactions.",
  template: `# Playwright Browser Automation

This skill provides browser automation capabilities via the Playwright MCP server.`,
  mcpConfig: {
    playwright: {
      command: "npx",
      args: ["@playwright/mcp@latest"],
    },
  },
};

const builtinSkills: SkillDefinition[] = [playwrightSkill];

export function getBuiltinSkills(): SkillDefinition[] {
  return builtinSkills;
}

export function getSkillByName(name: string): SkillDefinition | undefined {
  return builtinSkills.find(skill => skill.name === name);
}
