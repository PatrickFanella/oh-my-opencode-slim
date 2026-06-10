#!/usr/bin/env bash
# ────────────────────────────────────────────────────
# init-neubrutal-hud.sh
# Bootstrap a project with the Neubrutal HUD design
# system: Tailwind config, CSS, components, PostCSS.
# ────────────────────────────────────────────────────
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TEMPLATES_DIR="$SKILL_DIR/assets/templates"
TARGET_DIR="${1:-}"

if [ -z "$TARGET_DIR" ]; then
  echo "Usage: init-neubrutal-hud.sh <target-project-dir>"
  echo ""
  echo "  Copies the Neubrutal HUD design system templates into your project."
  echo "  Includes: tailwind.config.js, PostCSS config, CSS files, React components."
  exit 1
fi

if [ ! -d "$TARGET_DIR" ]; then
  echo "Error: target directory does not exist: $TARGET_DIR"
  exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Neubrutal HUD — Design System Bootstrap"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Source: $SKILL_DIR"
echo "  Target: $TARGET_DIR"
echo ""

# ── Config files ──
echo "→ Copying Tailwind config..."
cp -n "$TEMPLATES_DIR/tailwind.config.js" "$TARGET_DIR/" 2>/dev/null || echo "   (already exists, skipped)"

echo "→ Copying PostCSS config..."
cp -n "$TEMPLATES_DIR/postcss.config.js" "$TARGET_DIR/" 2>/dev/null || echo "   (already exists, skipped)"

# ── CSS templates ──
echo "→ Copying CSS templates..."
mkdir -p "$TARGET_DIR/app/src" 2>/dev/null || true
mkdir -p "$TARGET_DIR/dashboard/src" 2>/dev/null || true

cp -n "$TEMPLATES_DIR/app-styles.css" "$TARGET_DIR/app/src/styles.css" 2>/dev/null || echo "   app/src/styles.css (already exists, skipped)"
cp -n "$TEMPLATES_DIR/dashboard-styles.css" "$TARGET_DIR/dashboard/src/index.css" 2>/dev/null || echo "   dashboard/src/index.css (already exists, skipped)"

# ── Component templates ──
echo "→ Copying React component templates..."
mkdir -p "$TARGET_DIR/app/src/components" 2>/dev/null || true

for f in "$TEMPLATES_DIR/components/"*.tsx "$TEMPLATES_DIR/components/"*.ts; do
  name="$(basename "$f")"
  cp -n "$f" "$TARGET_DIR/app/src/components/$name" 2>/dev/null || echo "   app/src/components/$name (already exists, skipped)"
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Bootstrap complete."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "  1. Install dependencies:"
echo "     npm install -D tailwindcss@^3 postcss autoprefixer"
echo ""
echo "  2. Verify tailwind.config.js content paths match your project structure"
echo ""
echo "  3. Import JetBrains Mono in your HTML or CSS:"
echo "     @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap');"
echo ""
echo "  4. For the dashboard SPA, also import Space Grotesk or set body font-family:"
echo "     font-family: 'Space Grotesk', 'Inter', system-ui, sans-serif;"
echo ""
echo "  5. Include the CSS in your entry point:"
echo "     Public overlay:  import './styles.css'   (or app/src/styles.css)"
echo "     Dashboard:       import './index.css'    (or dashboard/src/index.css)"
echo ""
echo "Reference docs are in: $SKILL_DIR/references/"
