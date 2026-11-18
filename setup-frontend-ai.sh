#!/usr/bin/env bash

set -euo pipefail

# ==========================================
# Repository-local Claude Frontend Setup
# Project: ratelimit-engine
# ==========================================

echo ""
echo "Setting up repository-local frontend design skills..."
echo ""

# 1. Verify Git repository
if ! git rev-parse --show-toplevel >/dev/null 2>&1; then
    echo "ERROR: Run this script inside a Git repository."
    exit 1
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"
CURRENT_DIR="$(pwd -P)"

if [[ "$REPO_ROOT" != "$CURRENT_DIR" ]]; then
    echo "ERROR: Run this script from the repository root:"
    echo "$REPO_ROOT"
    exit 1
fi

# 2. Verify website directory
if [[ ! -d "$REPO_ROOT/website" ]]; then
    echo "ERROR: website/ directory not found."
    echo "No files have been created."
    exit 1
fi

cd "$REPO_ROOT"

# 3. Create directories
mkdir -p \
    .claude/skills/frontend-design \
    .claude/skills/ui-ux-review \
    .claude/skills/animation-design

echo "[OK] Claude skill directories created."

# 4. Create files without overwriting existing files
create_file() {
    local file="$1"

    if [[ -e "$file" ]]; then
        echo "[SKIP] Already exists: $file"
        return 0
    fi

    mkdir -p "$(dirname "$file")"
    cat > "$file"
    echo "[CREATED] $file"
}

# ==========================================
# SKILL 1: Frontend Design
# ==========================================

create_file ".claude/skills/frontend-design/SKILL.md" <<'EOF'
---
name: frontend-design
description: Create and redesign polished, distinctive, production-quality website interfaces. Use when implementing frontend pages, layouts, components or visual redesigns.
---

# Frontend Design

Act as a senior product designer and frontend engineer.

## Before implementation

1. Inspect the existing website structure.
2. Understand its framework and dependencies.
3. Inspect existing CSS and reusable components.
4. Understand the purpose and audience of the page.
5. Establish a coherent visual direction before coding.

## Visual direction

Aim for a premium technical editorial aesthetic.

Prioritize:
- Strong typography and visual hierarchy.
- Intentional whitespace.
- Editorial and asymmetric compositions.
- Restrained color palettes.
- Carefully selected font combinations.
- Consistent spacing and sizing.
- High-quality navigation.
- Clear content hierarchy.
- Responsive layouts.

## Avoid generic AI-generated designs

Never automatically default to:
- Violet or purple gradients.
- Excessively rounded cards.
- Repetitive three-column layouts.
- Unnecessary glassmorphism.
- Gradient blobs.
- Excessive borders and shadows.
- Generic SaaS hero sections.
- Repetitive icon-and-text cards.

Do not use decorative elements without a design purpose.

## Engineering

- Preserve existing business logic.
- Reuse existing dependencies where possible.
- Avoid unnecessary framework migrations.
- Use semantic HTML.
- Keep components maintainable.
- Avoid unnecessary dependencies.
- Only modify website/ files unless explicitly authorized.

## Quality

The result should look deliberately designed by an experienced product design team, not generated from a generic template.
EOF

# ==========================================
# SKILL 2: UI/UX Review
# ==========================================

create_file ".claude/skills/ui-ux-review/SKILL.md" <<'EOF'
---
name: ui-ux-review
description: Audit and improve frontend visual quality, accessibility, usability, responsiveness and design consistency. Use when reviewing or refining existing website pages.
---

# UI/UX Review

Act as a senior UI/UX designer conducting a professional design review.

## Review checklist

1. Visual hierarchy.
2. Typography and readability.
3. Spacing and alignment.
4. Color consistency and contrast.
5. Navigation and information architecture.
6. Responsive behavior.
7. Button and link interactions.
8. Accessibility.
9. Animation quality.
10. Loading and rendering performance.

## Review process

- Inspect the actual existing implementation.
- Identify visual problems.
- Explain why each problem matters.
- Recommend concrete improvements.
- Implement improvements when requested.
- Verify the rendered result.

## Responsive testing

Check:
- Desktop layouts.
- Tablet layouts.
- Mobile layouts.
- Navigation behavior at smaller widths.
- Text wrapping and overflow.
- Touch target sizes.

## Accessibility

- Use semantic HTML.
- Ensure keyboard navigation.
- Provide visible focus states.
- Maintain sufficient color contrast.
- Use appropriate ARIA attributes.
- Respect reduced-motion preferences.

Do not redesign components merely for novelty. Preserve usability and consistency.
EOF

# ==========================================
# SKILL 3: Animation Design
# ==========================================

create_file ".claude/skills/animation-design/SKILL.md" <<'EOF'
---
name: animation-design
description: Design and implement refined frontend animations, transitions, micro-interactions and scroll-based experiences. Use when adding or improving website animations.
---

# Animation Design

Act as a motion designer and frontend animation engineer.

## Animation principles

Animations should improve usability, storytelling or visual feedback.

Consider:
- Subtle entrance animations.
- Staggered content reveals.
- Scroll-triggered transitions.
- Smooth page transitions.
- Navigation interactions.
- Button hover and press feedback.
- Interactive visual demonstrations.
- Subtle parallax where appropriate.

## Technology selection

Choose based on the existing project:

- CSS transitions for simple hover and state changes.
- CSS keyframes for lightweight decorative animations.
- Motion for React-based animation workflows.
- GSAP for complex timelines and scroll-driven animation.

Do not introduce a library when CSS is sufficient.

## Performance

- Prefer transform and opacity animations.
- Avoid unnecessary layout recalculations.
- Avoid excessive simultaneous animations.
- Prevent content from remaining invisible if JavaScript fails.
- Respect prefers-reduced-motion.
- Avoid scroll hijacking.

## Design constraints

No excessive bouncing, spinning, glowing or continuous movement.

Motion must feel intentional, subtle and professional.
EOF

# ==========================================
# WEBSITE-SPECIFIC CLAUDE INSTRUCTIONS
# ==========================================

create_file "website/CLAUDE.md" <<'EOF'
# Website Development Instructions

These instructions apply specifically to the website/ directory.

## Project boundaries

- Work only inside website/.
- Do not modify backend source code.
- Do not modify CI/CD configurations.
- Do not modify root project configuration.
- Do not modify other company repositories.
- Do not change global Claude Code settings.
- Do not install global npm packages.
- Ask before introducing new dependencies.
- Preserve existing functionality.

## Design direction

Use a premium technical editorial aesthetic.

Take inspiration from the design quality of:
- Linear
- Vercel
- Stripe
- Raycast

These are visual references, not templates to copy.

## Design restrictions

Avoid:
- Default violet/purple gradients.
- Excessive rounded cards.
- Generic SaaS layouts.
- Repetitive three-column grids.
- Excessive borders.
- Unnecessary shadows.
- Generic gradient blobs.
- Excessive glassmorphism.

## Typography

- Establish a clear typographic hierarchy.
- Use deliberate font pairings.
- Prioritize readability.
- Use consistent font weights and line heights.

## Layout

- Use intentional whitespace.
- Prefer meaningful compositions over repetitive cards.
- Maintain alignment and consistent spacing.
- Ensure responsive behavior.
- Avoid horizontal overflow.

## Animations

- Use meaningful transitions.
- Add subtle hover feedback.
- Use scroll-triggered animation only where useful.
- Avoid excessive movement.
- Respect prefers-reduced-motion.
- Prioritize performance.

## Implementation rules

Before modifying a page:
1. Inspect the existing HTML, CSS and JavaScript.
2. Understand existing dependencies.
3. Identify reusable components.
4. Preserve existing content and functionality.
5. Avoid unnecessary rewrites.

## Visual verification

After implementation:
1. Run the website locally.
2. Inspect it in a real browser.
3. Check desktop and mobile.
4. Test navigation and interactions.
5. Check console errors.
6. Fix visual inconsistencies.

Do not declare a redesign complete simply because the code compiles.
EOF

# ==========================================
# LOCAL GIT EXCLUSIONS
# ==========================================

EXCLUDE_FILE=".git/info/exclude"

touch "$EXCLUDE_FILE"

add_exclusion() {
    local entry="$1"

    if ! grep -Fxq "$entry" "$EXCLUDE_FILE"; then
        printf '%s\n' "$entry" >> "$EXCLUDE_FILE"
    fi
}

add_exclusion ".claude/"
add_exclusion "website/CLAUDE.md"
add_exclusion "setup-frontend-ai.sh"

echo ""
echo "[OK] Local Git exclusions configured."

# ==========================================
# COMPLETION
# ==========================================

echo ""
echo "=========================================="
echo " FRONTEND AI SETUP COMPLETED"
echo "=========================================="
echo ""
echo "Created:"
echo "  .claude/skills/frontend-design/SKILL.md"
echo "  .claude/skills/ui-ux-review/SKILL.md"
echo "  .claude/skills/animation-design/SKILL.md"
echo "  website/CLAUDE.md"
echo ""
echo "Isolation:"
echo "  No global configuration changed."
echo "  No npm packages installed."
echo "  No MCP servers installed."
echo "  No existing files overwritten."
echo "  Local configuration excluded from Git."
echo ""
echo "Next: Open Claude Code from this repository."
echo "=========================================="
