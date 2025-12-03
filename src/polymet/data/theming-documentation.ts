/**
 * Theming System Documentation
 *
 * Complete guide for the Retina layered theming system with three interface levels,
 * component development guidelines, and quality checklists.
 */

export const themingDocumentation = `
# UI Theming System

## Overview

Retina uses a **three-level adaptive theming system** that automatically adjusts visual density, typography, and interaction patterns based on user expertise and decision workflow context.

---

## The Three Interface Levels

### 1. **Basic (Friendly)**

**Target Audience:** Board members, executives, non-technical stakeholders

**When to Use:**
- Initial decision setup (Layer 1-3)
- Board summaries and reports
- Executive dashboards
- First-time user experiences

**Visual Characteristics:**
- **Spacing:** Generous padding (24-32px), relaxed layouts
- **Typography:** Large text (18-20px body), clear hierarchy
- **Colors:** High contrast, semantic colors only
- **Interactions:** Large touch targets (44px min), explicit labels
- **Density:** Low - one primary action per screen section
- **Motion:** Smooth, gentle transitions (300-400ms)

**Design Tokens:**
\`\`\`typescript
{
  spacing: { section: 32, card: 24, element: 16 },
  typography: { body: 18, heading: 28, label: 16 },
  interactive: { minTarget: 44, buttonHeight: 44 },
  motion: { duration: 300, easing: "ease-out" }
}
\`\`\`

---

### 2. **Intermediate (Balanced)**

**Target Audience:** Analysts, managers, regular users

**When to Use:**
- Risk mapping and scenario modeling (Layer 4-5)
- Portfolio management
- Decision tracking and monitoring
- Daily operational tasks

**Visual Characteristics:**
- **Spacing:** Moderate padding (16-20px), balanced layouts
- **Typography:** Standard text (15-16px body), clear sections
- **Colors:** Semantic + accent colors for emphasis
- **Interactions:** Standard touch targets (40px), icons + labels
- **Density:** Medium - multiple related actions grouped
- **Motion:** Purposeful transitions (200-250ms)

**Design Tokens:**
\`\`\`typescript
{
  spacing: { section: 24, card: 16, element: 12 },
  typography: { body: 15, heading: 22, label: 14 },
  interactive: { minTarget: 40, buttonHeight: 40 },
  motion: { duration: 200, easing: "ease-in-out" }
}
\`\`\`

---

### 3. **Advanced (Expert)**

**Target Audience:** Quantitative analysts, risk managers, power users

**When to Use:**
- Expert workbench (Layer 6-8)
- Statistical analysis and copula configuration
- Sensitivity analysis and stress testing
- Data-intensive workflows

**Visual Characteristics:**
- **Spacing:** Compact padding (8-12px), dense layouts
- **Typography:** Smaller text (13-14px body), data-focused
- **Colors:** Full palette including data visualization colors
- **Interactions:** Compact targets (36px), icons only, tooltips
- **Density:** High - multiple panels, split views, tables
- **Motion:** Snappy transitions (150ms), reduced motion support

**Design Tokens:**
\`\`\`typescript
{
  spacing: { section: 16, card: 12, element: 8 },
  typography: { body: 13, heading: 18, label: 12 },
  interactive: { minTarget: 36, buttonHeight: 36 },
  motion: { duration: 150, easing: "ease-in" }
}
\`\`\`

---

## How to Add a Component That Respects Tokens

### Step 1: Import Theme Hooks

\`\`\`typescript
import { useInterfaceLevel } from "@/polymet/components/theme-provider";
import { getThemeTokens } from "@/polymet/data/theme-tokens";
\`\`\`

### Step 2: Read Current Level

\`\`\`typescript
export function MyComponent() {
  const level = useInterfaceLevel(); // "basic" | "intermediate" | "advanced"
  const tokens = getThemeTokens(level);
  
  // Use tokens for styling...
}
\`\`\`

### Step 3: Apply Tokens to Styling

**✅ CORRECT - Using Tokens:**

\`\`\`typescript
// Spacing from tokens
<div className="p-6 md:p-8 lg:p-4"> {/* Responsive to level */}
  <div style={{ padding: \`\${tokens.spacing.card}px\` }}>
    {/* Content */}
  </div>
</div>

// Typography from tokens
<h2 style={{ fontSize: \`\${tokens.typography.heading}px\` }}>
  Title
</h2>

// Semantic colors (always use these)
<Button className="bg-primary text-primary-foreground">
  Action
</Button>

// Interactive sizing
<button 
  style={{ 
    minHeight: \`\${tokens.interactive.minTarget}px\`,
    minWidth: \`\${tokens.interactive.minTarget}px\`
  }}
>
  <Icon />
</button>
\`\`\`

**❌ INCORRECT - Hard-coded Values:**

\`\`\`typescript
// DON'T: Hard-coded spacing
<div className="p-4"> {/* Fixed padding */}

// DON'T: Hard-coded colors
<div className="bg-blue-500 text-white"> {/* Bypasses theme */}

// DON'T: Hard-coded sizes
<button style={{ height: "40px" }}> {/* Not adaptive */}
\`\`\`

### Step 4: Use Semantic Tailwind Classes

**Always prefer semantic classes over static colors:**

\`\`\`typescript
// ✅ Semantic classes (handles light/dark automatically)
bg-background text-foreground
bg-card text-card-foreground
bg-primary text-primary-foreground
bg-secondary text-secondary-foreground
bg-muted text-muted-foreground
bg-accent text-accent-foreground
border border-border

// ❌ Static classes (bypasses theme system)
bg-blue-500 text-white
bg-gray-100 text-gray-900
border-gray-300
\`\`\`

### Step 5: Handle Motion

\`\`\`typescript
import { useReducedMotion } from "@/polymet/data/reduced-motion-support";

export function AnimatedComponent() {
  const level = useInterfaceLevel();
  const tokens = getThemeTokens(level);
  const prefersReducedMotion = useReducedMotion();
  
  const duration = prefersReducedMotion ? 0 : tokens.motion.duration;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: duration / 1000 }}
    >
      Content
    </motion.div>
  );
}
\`\`\`

---

## Quality Checklists

### ✅ Accessibility (a11y) Checklist

- [ ] **Color Contrast:** All text meets WCAG AA (4.5:1 for normal, 3:1 for large)
- [ ] **Touch Targets:** Minimum 44px for basic, 40px for intermediate, 36px for advanced
- [ ] **Keyboard Navigation:** All interactive elements reachable via Tab
- [ ] **Focus Indicators:** Visible focus ring on all interactive elements
- [ ] **ARIA Labels:** Screen reader text for icon-only buttons
- [ ] **Semantic HTML:** Use \`<button>\`, \`<nav>\`, \`<main>\`, etc.
- [ ] **Alt Text:** All images have descriptive alt attributes
- [ ] **Reduced Motion:** Respect \`prefers-reduced-motion\` media query
- [ ] **Color Independence:** Information not conveyed by color alone
- [ ] **Form Labels:** All inputs have associated \`<label>\` elements

**Testing:**
\`\`\`typescript
import { checkAccessibility } from "@/polymet/data/accessibility-checker";

const report = checkAccessibility(level, componentRef);
console.log(report.violations); // Fix any issues
\`\`\`

---

### ✅ Density Checklist

- [ ] **Spacing Tokens:** Use \`tokens.spacing\` for all padding/margins
- [ ] **Responsive Layout:** Adjust columns/rows based on level
- [ ] **Content Prioritization:** Show less at basic, more at advanced
- [ ] **Collapsible Sections:** Allow users to expand/collapse details
- [ ] **Progressive Disclosure:** Reveal complexity gradually
- [ ] **Touch Target Sizing:** Use \`tokens.interactive.minTarget\`
- [ ] **Typography Scale:** Use \`tokens.typography\` for all text
- [ ] **Icon Sizing:** Scale icons based on level (24px → 20px → 16px)
- [ ] **Button Sizing:** Use \`tokens.interactive.buttonHeight\`
- [ ] **Grid Density:** Adjust gap and columns per level

**Example:**
\`\`\`typescript
const columns = level === "basic" ? 1 : level === "intermediate" ? 2 : 3;
const gap = tokens.spacing.element;

<div className="grid" style={{ 
  gridTemplateColumns: \`repeat(\${columns}, 1fr)\`,
  gap: \`\${gap}px\`
}}>
  {items.map(item => <Card key={item.id} {...item} />)}
</div>
\`\`\`

---

### ✅ Motion Checklist

- [ ] **Duration Tokens:** Use \`tokens.motion.duration\` for all animations
- [ ] **Easing Tokens:** Use \`tokens.motion.easing\` for transitions
- [ ] **Reduced Motion:** Check \`prefers-reduced-motion\` and disable animations
- [ ] **Purposeful Motion:** Animate only to guide attention or show relationships
- [ ] **Performance:** Use \`transform\` and \`opacity\` (GPU-accelerated)
- [ ] **Interruption:** Allow animations to be interrupted/cancelled
- [ ] **Loading States:** Show skeleton or spinner during async operations
- [ ] **Micro-interactions:** Subtle hover/focus feedback
- [ ] **Page Transitions:** Smooth navigation between routes
- [ ] **Scroll Behavior:** Smooth scroll with \`scroll-behavior: smooth\`

**Example:**
\`\`\`typescript
const prefersReducedMotion = useReducedMotion();
const duration = prefersReducedMotion ? 0 : tokens.motion.duration;

<div 
  className="transition-all"
  style={{ 
    transitionDuration: \`\${duration}ms\`,
    transitionTimingFunction: tokens.motion.easing
  }}
>
  Content
</div>
\`\`\`

---

### ✅ Analytics Checklist

- [ ] **Level Tracking:** Log when user changes interface level
- [ ] **Component Usage:** Track which components are used at each level
- [ ] **Performance Metrics:** Measure render time per level
- [ ] **Error Tracking:** Log errors with level context
- [ ] **User Preferences:** Track level preferences per user/tenant
- [ ] **A/B Testing:** Test level defaults for different user segments
- [ ] **Heatmaps:** Visualize interaction patterns per level
- [ ] **Session Recording:** Record sessions with level metadata
- [ ] **Conversion Funnels:** Track task completion per level
- [ ] **Feedback Collection:** Gather user feedback on level appropriateness

**Example:**
\`\`\`typescript
import { useTenant } from "@/polymet/data/tenant-context";

export function MyComponent() {
  const level = useInterfaceLevel();
  const { tenantId } = useTenant();
  
  useEffect(() => {
    // Track component mount with level context
    analytics.track("component.mounted", {
      component: "MyComponent",
      level,
      tenantId,
      timestamp: Date.now()
    });
  }, [level, tenantId]);
  
  const handleAction = () => {
    analytics.track("component.action", {
      component: "MyComponent",
      action: "button_click",
      level,
      tenantId
    });
  };
  
  return <Button onClick={handleAction}>Action</Button>;
}
\`\`\`

---

## Component Development Workflow

### 1. **Design Phase**
- Sketch component at all three levels
- Identify what changes between levels (spacing, labels, icons)
- Plan progressive disclosure strategy

### 2. **Implementation Phase**
- Start with intermediate level (most common)
- Add basic level (simplify, enlarge)
- Add advanced level (densify, add features)
- Test all three levels side-by-side

### 3. **Testing Phase**
- Run accessibility checker at all levels
- Test keyboard navigation
- Test with reduced motion enabled
- Test light and dark modes
- Test responsive breakpoints

### 4. **Documentation Phase**
- Document props interface
- Add usage examples for each level
- Note any level-specific behavior
- Add to component library

---

## Common Patterns

### Pattern 1: Conditional Rendering by Level

\`\`\`typescript
export function AdaptiveCard({ title, description, metrics }: Props) {
  const level = useInterfaceLevel();
  const tokens = getThemeTokens(level);
  
  return (
    <Card style={{ padding: \`\${tokens.spacing.card}px\` }}>
      <h3 style={{ fontSize: \`\${tokens.typography.heading}px\` }}>
        {title}
      </h3>
      
      {/* Always show description at basic/intermediate */}
      {level !== "advanced" && <p>{description}</p>}
      
      {/* Show detailed metrics only at advanced */}
      {level === "advanced" && (
        <MetricsTable data={metrics} compact />
      )}
    </Card>
  );
}
\`\`\`

### Pattern 2: Adaptive Icon + Label

\`\`\`typescript
export function AdaptiveButton({ icon: Icon, label, onClick }: Props) {
  const level = useInterfaceLevel();
  const showLabel = level !== "advanced";
  
  return (
    <Button onClick={onClick} aria-label={label}>
      <Icon className="h-5 w-5" />
      {showLabel && <span className="ml-2">{label}</span>}
    </Button>
  );
}
\`\`\`

### Pattern 3: Responsive Grid Density

\`\`\`typescript
export function AdaptiveGrid({ items }: Props) {
  const level = useInterfaceLevel();
  const tokens = getThemeTokens(level);
  
  const columns = {
    basic: 1,
    intermediate: 2,
    advanced: 3
  }[level];
  
  return (
    <div 
      className="grid"
      style={{
        gridTemplateColumns: \`repeat(\${columns}, 1fr)\`,
        gap: \`\${tokens.spacing.element}px\`
      }}
    >
      {items.map(item => <GridItem key={item.id} {...item} />)}
    </div>
  );
}
\`\`\`

---

## Migration Guide

### Migrating Existing Components

1. **Identify Hard-coded Values:**
   - Search for \`className="p-4"\`, \`style={{ padding: "16px" }}\`
   - Search for \`bg-blue-500\`, \`text-gray-900\`
   - Search for \`height: "40px"\`, \`fontSize: "16px"\`

2. **Replace with Tokens:**
   - Import \`useInterfaceLevel\` and \`getThemeTokens\`
   - Replace spacing with \`tokens.spacing.*\`
   - Replace colors with semantic classes
   - Replace sizes with \`tokens.interactive.*\`

3. **Test All Levels:**
   - Use \`/playground/theme-check\` to preview
   - Run accessibility checker
   - Verify responsive behavior

4. **Update Documentation:**
   - Add level-specific notes to component docs
   - Update Storybook examples

---

## Troubleshooting

### Issue: Component looks wrong at advanced level
**Solution:** Check if spacing is too generous. Advanced level should be compact.

### Issue: Text is too small to read
**Solution:** Ensure minimum font size of 13px even at advanced level. Use \`tokens.typography.body\`.

### Issue: Buttons are too small to tap
**Solution:** Use \`tokens.interactive.minTarget\` for minimum touch target size.

### Issue: Colors don't work in dark mode
**Solution:** Use semantic Tailwind classes (\`bg-background\`, \`text-foreground\`) instead of static colors.

### Issue: Animations are too slow/fast
**Solution:** Use \`tokens.motion.duration\` and respect \`prefers-reduced-motion\`.

---

## Resources

- **Theme Tokens:** \`@/polymet/data/theme-tokens\`
- **Theme Provider:** \`@/polymet/components/theme-provider\`
- **Accessibility Checker:** \`@/polymet/data/accessibility-checker\`
- **Reduced Motion:** \`@/polymet/data/reduced-motion-support\`
- **Type & Motion:** \`@/polymet/data/type-and-motion\`
- **Playground:** \`/playground/theme-check\`

---

## Quick Reference

### Import Statements
\`\`\`typescript
import { useInterfaceLevel } from "@/polymet/components/theme-provider";
import { getThemeTokens } from "@/polymet/data/theme-tokens";
import { useReducedMotion } from "@/polymet/data/reduced-motion-support";
import { checkAccessibility } from "@/polymet/data/accessibility-checker";
\`\`\`

### Token Access
\`\`\`typescript
const level = useInterfaceLevel();
const tokens = getThemeTokens(level);

tokens.spacing.section    // 32 | 24 | 16
tokens.spacing.card       // 24 | 16 | 12
tokens.spacing.element    // 16 | 12 | 8
tokens.typography.body    // 18 | 15 | 13
tokens.typography.heading // 28 | 22 | 18
tokens.interactive.minTarget // 44 | 40 | 36
tokens.motion.duration    // 300 | 200 | 150
\`\`\`

### Semantic Colors
\`\`\`typescript
bg-background text-foreground
bg-card text-card-foreground
bg-primary text-primary-foreground
bg-secondary text-secondary-foreground
bg-muted text-muted-foreground
bg-accent text-accent-foreground
bg-destructive text-destructive-foreground
border border-border
\`\`\`

---

**Last Updated:** 2025-01-09
**Version:** 1.0.0
`;

export default themingDocumentation;
