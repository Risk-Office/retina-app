/**
 * Theming System README
 *
 * Complete overview of the Retina theming system with documentation,
 * ESLint enforcement, and developer workflow.
 */

export const themingSystemReadme = `
# Retina Theming System

## 📚 Overview

The Retina theming system provides a **three-level adaptive UI** that automatically adjusts visual density, typography, and interaction patterns based on user expertise and decision workflow context.

---

## 🎯 Key Components

### 1. **Documentation** (\`@/polymet/data/theming-documentation\`)

Comprehensive guide covering:
- ✅ Three interface levels (Basic, Intermediate, Advanced)
- ✅ When to use each level
- ✅ How to add components that respect tokens
- ✅ Checklists for a11y, density, motion, and analytics
- ✅ Common patterns and troubleshooting

**View:** Import and render the documentation component

### 2. **ESLint Plugin** (\`@/polymet/data/eslint-plugin-layered-ui\`)

Enforces theme token usage with 4 rules:
- ✅ \`no-hardcoded-colors\` - Forbids static color classes
- ✅ \`no-hardcoded-spacing\` - Forbids fixed spacing values
- ✅ \`require-theme-tokens\` - Requires token imports
- ✅ \`no-hardcoded-font-sizes\` - Forbids static text sizes

**Result:** New components fail lint if they bypass tokens ✅

---

## 🚀 Quick Start

### Step 1: Read the Documentation

\`\`\`typescript
import themingDocumentation from "@/polymet/data/theming-documentation";

// View in your browser or IDE
console.log(themingDocumentation);
\`\`\`

### Step 2: Configure ESLint

\`\`\`javascript
// .eslintrc.js
module.exports = {
  extends: ["plugin:layered-ui/recommended"],
  plugins: ["layered-ui"],
  rules: {
    "layered-ui/no-hardcoded-colors": "error",
    "layered-ui/no-hardcoded-spacing": "error",
    "layered-ui/require-theme-tokens": "warn",
    "layered-ui/no-hardcoded-font-sizes": "error",
  },
};
\`\`\`

### Step 3: Create Token-Based Components

\`\`\`typescript
import { useInterfaceLevel } from "@/polymet/components/theme-provider";
import { getThemeTokens } from "@/polymet/data/theme-tokens";

export function MyComponent() {
  const level = useInterfaceLevel();
  const tokens = getThemeTokens(level);
  
  return (
    <div 
      className="bg-card text-card-foreground border border-border"
      style={{ padding: \`\${tokens.spacing.card}px\` }}
    >
      <h2 style={{ fontSize: \`\${tokens.typography.heading}px\` }}>
        Title
      </h2>
      <p style={{ fontSize: \`\${tokens.typography.body}px\` }}>
        Content adapts to user's interface level
      </p>
    </div>
  );
}
\`\`\`

---

## 📋 The Three Levels

### Basic (Friendly)
- **Target:** Executives, board members
- **Spacing:** 32px sections, 24px cards
- **Typography:** 18px body, 28px headings
- **Touch Targets:** 44px minimum
- **Use Cases:** Decision setup, board reports

### Intermediate (Balanced)
- **Target:** Analysts, managers
- **Spacing:** 24px sections, 16px cards
- **Typography:** 15px body, 22px headings
- **Touch Targets:** 40px minimum
- **Use Cases:** Risk mapping, portfolios

### Advanced (Expert)
- **Target:** Quantitative analysts
- **Spacing:** 16px sections, 12px cards
- **Typography:** 13px body, 18px headings
- **Touch Targets:** 36px minimum
- **Use Cases:** Expert workbench, statistics

---

## ✅ Quality Checklists

### Accessibility (a11y)
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Touch targets meet minimum sizes
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] ARIA labels on icon buttons
- [ ] Semantic HTML elements
- [ ] Alt text on images
- [ ] Reduced motion support
- [ ] Color-independent information
- [ ] Form labels associated

### Density
- [ ] Spacing tokens used throughout
- [ ] Responsive layout per level
- [ ] Content prioritization
- [ ] Collapsible sections
- [ ] Progressive disclosure
- [ ] Touch target sizing
- [ ] Typography scale
- [ ] Icon sizing
- [ ] Button sizing
- [ ] Grid density

### Motion
- [ ] Duration tokens used
- [ ] Easing tokens used
- [ ] Reduced motion check
- [ ] Purposeful animations
- [ ] GPU-accelerated properties
- [ ] Interruptible animations
- [ ] Loading states
- [ ] Micro-interactions
- [ ] Page transitions
- [ ] Smooth scrolling

### Analytics
- [ ] Level tracking
- [ ] Component usage tracking
- [ ] Performance metrics
- [ ] Error tracking with context
- [ ] User preferences
- [ ] A/B testing
- [ ] Heatmaps
- [ ] Session recording
- [ ] Conversion funnels
- [ ] Feedback collection

---

## 🔧 ESLint Rules

### Rule 1: no-hardcoded-colors

**Forbids:**
\`\`\`typescript
// ❌ Static color classes
<div className="bg-blue-500 text-white">

// ❌ Hex colors
<div style={{ color: "#3b82f6" }}>

// ❌ RGB colors
<div style={{ backgroundColor: "rgb(59, 130, 246)" }}>
\`\`\`

**Requires:**
\`\`\`typescript
// ✅ Semantic classes
<div className="bg-primary text-primary-foreground">
<div className="bg-card text-card-foreground border border-border">
\`\`\`

### Rule 2: no-hardcoded-spacing

**Forbids:**
\`\`\`typescript
// ❌ Fixed Tailwind spacing
<div className="p-4 m-2 gap-3">

// ❌ Pixel values
<div style={{ padding: "16px", margin: "8px" }}>
\`\`\`

**Requires:**
\`\`\`typescript
// ✅ Theme tokens
const tokens = getThemeTokens(level);
<div style={{ padding: \`\${tokens.spacing.card}px\` }}>
\`\`\`

### Rule 3: require-theme-tokens

**Requires:**
\`\`\`typescript
// ✅ Import theme utilities
import { useInterfaceLevel } from "@/polymet/components/theme-provider";
import { getThemeTokens } from "@/polymet/data/theme-tokens";

// ✅ Use in component
const level = useInterfaceLevel();
const tokens = getThemeTokens(level);
\`\`\`

### Rule 4: no-hardcoded-font-sizes

**Forbids:**
\`\`\`typescript
// ❌ Static text classes
<h1 className="text-2xl">

// ❌ Pixel values
<p style={{ fontSize: "16px" }}>
\`\`\`

**Requires:**
\`\`\`typescript
// ✅ Typography tokens
<h1 style={{ fontSize: \`\${tokens.typography.heading}px\` }}>
<p style={{ fontSize: \`\${tokens.typography.body}px\` }}>
\`\`\`

---

## 🎨 Semantic Color Classes

Always use semantic classes that handle light/dark mode automatically:

\`\`\`typescript
// Background colors
bg-background, bg-card, bg-popover
bg-primary, bg-secondary, bg-muted, bg-accent, bg-destructive

// Text colors
text-foreground, text-card-foreground, text-popover-foreground
text-primary-foreground, text-secondary-foreground
text-muted-foreground, text-accent-foreground

// Borders
border-border, border-input, ring-ring

// Charts
bg-chart-1, bg-chart-2, bg-chart-3, bg-chart-4, bg-chart-5
\`\`\`

---

## 📦 Token Structure

\`\`\`typescript
interface ThemeTokens {
  spacing: {
    section: number;  // 32 | 24 | 16
    card: number;     // 24 | 16 | 12
    element: number;  // 16 | 12 | 8
  };
  typography: {
    body: number;     // 18 | 15 | 13
    heading: number;  // 28 | 22 | 18
    label: number;    // 16 | 14 | 12
  };
  interactive: {
    minTarget: number;    // 44 | 40 | 36
    buttonHeight: number; // 44 | 40 | 36
  };
  motion: {
    duration: number; // 300 | 200 | 150
    easing: string;   // "ease-out" | "ease-in-out" | "ease-in"
  };
}
\`\`\`

---

## 🧪 Testing

### Test All Three Levels

\`\`\`typescript
// Use the theme check playground
// Navigate to: /playground/theme-check

// Or test programmatically
import { checkAccessibility } from "@/polymet/data/accessibility-checker";

const report = checkAccessibility("basic", componentRef);
console.log(report.violations);
\`\`\`

### Run ESLint

\`\`\`bash
# Check for token violations
npm run lint

# Auto-fix where possible
npm run lint -- --fix
\`\`\`

---

## 📖 Resources

### Core Files
- **Documentation:** \`@/polymet/data/theming-documentation\`
- **ESLint Plugin:** \`@/polymet/data/eslint-plugin-layered-ui\`
- **Theme Tokens:** \`@/polymet/data/theme-tokens\`
- **Theme Provider:** \`@/polymet/components/theme-provider\`
- **Layer Presets:** \`@/polymet/data/layer-presets\`

### Utilities
- **Accessibility Checker:** \`@/polymet/data/accessibility-checker\`
- **Reduced Motion:** \`@/polymet/data/reduced-motion-support\`
- **Type & Motion:** \`@/polymet/data/type-and-motion\`

### Testing
- **Playground:** \`/playground/theme-check\`
- **Test Helpers:** \`@/polymet/data/test-helpers\`

---

## 🎯 Acceptance Criteria

✅ **Three levels documented** - Basic, Intermediate, Advanced with use cases
✅ **Component guide provided** - Step-by-step token integration
✅ **Checklists included** - a11y, density, motion, analytics
✅ **ESLint rules created** - 4 rules to enforce token usage
✅ **New components fail lint** - If they bypass tokens

---

## 🚦 Developer Workflow

1. **Read Documentation** - Understand the three levels
2. **Configure ESLint** - Add plugin to project
3. **Create Component** - Use theme hooks and tokens
4. **Test All Levels** - Use playground or programmatic tests
5. **Run Lint** - Ensure no token violations
6. **Review Checklist** - Verify a11y, density, motion, analytics
7. **Ship** - Deploy with confidence

---

## 💡 Common Patterns

### Pattern 1: Adaptive Spacing
\`\`\`typescript
const tokens = getThemeTokens(level);
<div style={{ padding: \`\${tokens.spacing.card}px\` }}>
\`\`\`

### Pattern 2: Conditional Rendering
\`\`\`typescript
{level !== "advanced" && <Description />}
{level === "advanced" && <CompactView />}
\`\`\`

### Pattern 3: Responsive Grid
\`\`\`typescript
const columns = { basic: 1, intermediate: 2, advanced: 3 }[level];
<div style={{ gridTemplateColumns: \`repeat(\${columns}, 1fr)\` }}>
\`\`\`

---

## 🐛 Troubleshooting

**Q: ESLint shows errors on existing components**
A: Migrate gradually. Use \`// eslint-disable-next-line\` temporarily.

**Q: Component looks wrong at advanced level**
A: Check spacing tokens. Advanced should be compact (12px cards).

**Q: Colors don't work in dark mode**
A: Use semantic classes (\`bg-background\`, \`text-foreground\`).

**Q: Animations are too slow**
A: Use \`tokens.motion.duration\` and respect \`prefers-reduced-motion\`.

---

**Version:** 1.0.0
**Last Updated:** 2025-01-09
**Status:** ✅ Production Ready
`;

export default themingSystemReadme;
