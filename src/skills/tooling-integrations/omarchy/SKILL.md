---
name: omarchy
description: >
  REQUIRED for end-user customization of Linux desktop, window manager, or system config.
  Use when editing ~/.config/hypr/, ~/.config/waybar/, ~/.config/walker/,
  ~/.config/alacritty/, ~/.config/foot/, ~/.config/kitty/, ~/.config/ghostty/, ~/.config/mako/,
  or ~/.config/omarchy/. Triggers: Hyprland, window rules, animations, keybindings,
  monitors, gaps, borders, blur, opacity, waybar, walker, terminal config, themes,
  wallpaper, night light, idle, lock screen, screenshots, reminders, layer rules,
  workspace settings, display config, and user-facing omarchy commands. Excludes Omarchy
  source development in ~/.local/share/omarchy/ and `omarchy dev` workflows.
---

# Omarchy Skill

Use this for end-user Omarchy customization tasks.

## Mandatory Trigger

Invoke this skill for requests touching:

- `~/.config/hypr/`
- `~/.config/waybar/`, `~/.config/walker/`, `~/.config/mako/`
- terminal configs (`alacritty`, `foot`, `kitty`, `ghostty`)
- `~/.config/omarchy/`
- omarchy user commands (theme/refresh/restart/toggle/capture/reminder/pkg)

Do **not** use for Omarchy source development (`~/.local/share/omarchy/`, migrations, `omarchy dev ...`).

## Critical Safety

- Never modify `~/.local/share/omarchy/` in end-user tasks.
- Reading `~/.local/share/omarchy/` is safe.
- Write only under `~/.config/` and user custom dirs.

## Operating Rules

1. Prefer `omarchy <group> <action>` commands.
2. Discover commands via `omarchy commands` / `omarchy <group> --help`.
3. For Hyprland edits, always run:

```bash
hyprctl reload
hyprctl configerrors
```

4. For Waybar edits, always run:

```bash
omarchy restart waybar
```

5. For Walker/terminal edits, restart corresponding service/app.
6. Before destructive reset (`omarchy refresh ...`, reinstall), ask explicit user confirmation.

## Keybinding Rebind Rule

Before changing a bound key:

1. inspect current map (`omarchy menu keybindings --print`)
2. add `unbind` first if key already used
3. tell user previous mapping

## Window Rules Rule

Before writing Hyprland window rules, verify latest syntax in official wiki (rules change across versions).

## Troubleshooting Rule

Use non-interactive debug flags:

```bash
omarchy debug --no-sudo --print
```

## Resources

- `references/full-guide.md` — architecture, command groups, config map, safe patterns, troubleshooting.
