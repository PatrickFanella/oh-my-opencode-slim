# Omarchy — Full Guide

Detailed material moved out of `SKILL.md` for progressive disclosure.

## Scope

For end-user customization of installed Omarchy systems.

In scope:

- edits under `~/.config/hypr/`, `~/.config/waybar/`, `~/.config/walker/`, `~/.config/mako/`
- terminal configs (`alacritty`, `foot`, `kitty`, `ghostty`)
- edits under `~/.config/omarchy/`
- themes, keybindings, monitors, layer rules, wallpapers, reminders, capture, idle/lock/night-light

Out of scope:

- Omarchy source development (`~/.local/share/omarchy/`, migrations, `omarchy dev ...`)

## Safety Boundary (Critical)

Never edit `~/.local/share/omarchy/` for end-user customization.

- Reading is safe and encouraged.
- Writing there is update-hostile and will be overwritten.

Safe write targets:

- `~/.config/...`
- `~/.config/omarchy/themes/<custom>/`
- `~/.config/omarchy/hooks/`

## Command Discovery

Prefer unified CLI:

```bash
omarchy commands
omarchy <group> --help
omarchy <group> <action> --help
omarchy commands --json
```

Read implementation when needed:

```bash
cat $(which omarchy-theme-set)
```

## Common Command Groups

- `omarchy refresh`
- `omarchy restart`
- `omarchy toggle`
- `omarchy theme`
- `omarchy install`
- `omarchy launch`
- `omarchy capture`
- `omarchy reminder`
- `omarchy pkg`
- `omarchy setup`
- `omarchy update`

## Config Map

### Hyprland

`~/.config/hypr/` (`hyprland.conf`, `bindings.conf`, `monitors.conf`, `looknfeel.conf`, `hypridle.conf`, etc.)

Validation after any Hyprland edit:

```bash
hyprctl reload
hyprctl configerrors
```

Fix until clean or real blocker documented.

### Waybar

`~/.config/waybar/config.jsonc`, `~/.config/waybar/style.css`

Waybar does **not** auto-reload:

```bash
omarchy restart waybar
```

### Terminals

- `~/.config/alacritty/alacritty.toml`
- `~/.config/foot/foot.ini`
- `~/.config/kitty/kitty.conf`
- `~/.config/ghostty/config`

Apply with:

```bash
omarchy restart terminal
```

## Safe Customization Patterns

1. Read current config.
2. Backup target file.
3. Edit only user config path.
4. Apply/restart relevant component.
5. Validate (`hyprctl configerrors` for Hyprland).

### Theme creation

1. Create new dir in `~/.config/omarchy/themes/<name>/`
2. Reference stock themes from `~/.local/share/omarchy/themes/`
3. Add assets
4. Activate: `omarchy theme set "<Name>"`

### Hook automation

Use `~/.config/omarchy/hooks/` scripts (e.g., `theme-set`, `font-set`, `post-update`).

### Reset to defaults (destructive-ish)

Always ask user confirmation before refresh/reset actions.

```bash
omarchy refresh waybar
omarchy refresh hyprland
omarchy refresh config <relative-path>
```

## Keybindings Rule

Before rebind:

1. inspect current bindings (`omarchy menu keybindings --print`)
2. if already bound, add `unbind` first
3. tell user what old binding was

Example:

```ini
unbind = SUPER, F
bind = SUPER, F, exec, nautilus
```

## Window Rules Rule

Hyprland syntax changes. Verify current rule syntax from official wiki before writing rules.

Source:

- https://github.com/hyprwm/hyprland-wiki/blob/main/content/Configuring/Window-Rules.md

## Troubleshooting Commands

Use non-interactive debug flags:

```bash
omarchy debug --no-sudo --print
omarchy upload log
omarchy refresh <app>
omarchy reinstall
```

## Decision Framework

1. Stock command exists? use it.
2. Config edit? `~/.config/` only.
3. Theme customization? new custom dir.
4. Automation? hooks.
5. Package install? `omarchy pkg ...`
6. Unsure command? `omarchy commands`.

## Reminder Requests

Convert natural language duration to minutes:

```bash
omarchy reminder 15 "Pickup Jack"
omarchy reminder show
omarchy reminder clear
```
