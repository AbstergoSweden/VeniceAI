# Palette's Journal - Venice.ai Generator

## 2025-12-16 - ARIA Labels for Icon Buttons

**Learning:** In this Material 3 Expressive design system, many buttons combine icons + text labels, but screen readers benefit from explicit `aria-label` attributes that provide clearer context than the visible text alone. For example, "Idea" is ambiguous, but "Generate prompt from idea" is clear.

**Action:** When adding accessibility to icon buttons:

- Use `aria-label` even when text is present if the text is ambiguous
- Dynamic labels (using template literals) are valuable for contextual actions (e.g., "Download image with seed 123456")
- Modal close buttons should always state "Close [modal name]" not just "Close"
- Action buttons in galleries should include the item's identifying info (seed, ID, etc.)

**Impact:** Improved screen reader experience for 11 buttons across the app without changing visual design. Users with visual impairments can now understand button purposes without visual context.
