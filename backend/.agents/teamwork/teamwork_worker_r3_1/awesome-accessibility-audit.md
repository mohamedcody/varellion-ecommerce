# Local Copy: awesome-accessibility-audit

Guidelines for WCAG 2.1 / 2.2 AA audit and remediation.
Source: /home/mohamed-saad/Desktop/BRAND/.agents/skills/awesome-accessibility-audit/SKILL.md
Key rules:
1. Keyboard accessibility: visible focus indicators (`:focus-visible:ring-*`), no keyboard traps.
2. Form labels: explicit association via `htmlFor` and `id`; correct `autoComplete` attributes.
3. Decorative icons: `aria-hidden="true"`.
4. Dynamic regions: `role="alert"` / `aria-live="polite"` for errors; `role="status"` / `aria-live="polite"` for asynchronous status messages.
5. HTML semantics: no invalid interactive nesting (no `<button>` inside `<a>` or `<Link>`); correct heading hierarchy.
6. Reduced motion: `motion-reduce:animate-none` for animations.
7. Text and typography: `translate="no"` on proper nouns/brand names; typographical quotes (`“`, `”`) and ellipses (`…`).
