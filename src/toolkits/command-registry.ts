export type CommandTemplate = {
  description: string;
  template: string;
};

export function registerCommandTemplates(
  opencodeConfig: Record<string, unknown>,
  templates: Record<string, CommandTemplate>,
): void {
  const existing = opencodeConfig.command;

  if (!existing || typeof existing !== 'object' || Array.isArray(existing)) {
    opencodeConfig.command = {};
  }

  const commands = opencodeConfig.command as Record<string, unknown>;

  for (const [name, template] of Object.entries(templates)) {
    if (commands[name] !== undefined) {
      continue;
    }
    commands[name] = template;
  }
}
