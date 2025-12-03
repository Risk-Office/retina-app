/**
 * # Accessibility System Documentation
 *
 * Complete guide to the Retina accessibility system with automated checks,
 * WCAG AA compliance, and testing utilities.
 *
 * ## Overview
 *
 * The Retina accessibility system ensures that all three interface levels
 * (basic, intermediate, advanced) meet WCAG AA standards and provide
 * excellent keyboard navigation, focus management, and reduced motion support.
 *
 * ## Components
 *
 * ### 1. Accessibility Checker (`@/polymet/data/accessibility-checker`)
 *
 * Automated testing utilities for:
 * - **Contrast Checks**: WCAG AA compliance (4.5:1 for normal text, 3:1 for large text)
 * - **Focus Order**: Sequential tab navigation and landmark validation
 * - **Keyboard Navigation**: Interactive element accessibility
 * - **Reduced Motion**: prefers-reduced-motion support
 *
 * #### Usage
 *
 * ```typescript
 * import { runAccessibilityAudit, formatAccessibilityReport } from "@/polymet/data/accessibility-checker";
 *
 * // Run audit on a container
 * const report = runAccessibilityAudit(containerElement, "basic");
 *
 * // Check if all tests passed
 * if (report.overallPass) {
 *   console.log("✓ All accessibility checks passed!");
 * }
 *
 * // Print detailed report
 * console.log(formatAccessibilityReport(report));
 * ```
 *
 * #### API Reference
 *
 * **`checkContrast(foreground, background, isLargeText, context)`**
 * - Checks contrast ratio between two colors
 * - Returns: `ContrastCheckResult` with pass/fail status and ratio
 *
 * **`checkThemeTokenContrast(level)`**
 * - Checks all theme token combinations for a level
 * - Returns: Array of `ContrastCheckResult`
 *
 * **`checkFocusOrder(container)`**
 * - Validates focus order and landmarks
 * - Returns: `FocusOrderCheckResult` with issues
 *
 * **`checkKeyboardNav(container)`**
 * - Checks keyboard accessibility of interactive elements
 * - Returns: `KeyboardNavCheckResult` with issues
 *
 * **`checkReducedMotion(container)`**
 * - Validates reduced motion support
 * - Returns: `ReducedMotionCheckResult`
 *
 * **`runAccessibilityAudit(container, level)`**
 * - Runs all checks and returns comprehensive report
 * - Returns: `AccessibilityReport`
 *
 * ### 2. Reduced Motion Support (`@/polymet/data/reduced-motion-support`)
 *
 * Utilities for respecting user's motion preferences:
 *
 * ```typescript
 * import { useReducedMotion, getTransitionClasses } from "@/polymet/data/reduced-motion-support";
 *
 * function MyComponent() {
 *   const prefersReduced = useReducedMotion();
 *
 *   return (
 *     <div className={getTransitionClasses(
 *       "transition-all duration-300", // Normal
 *       "" // Reduced motion
 *     )}>
 *       Content
 *     </div>
 *   );
 * }
 * ```
 *
 * #### API Reference
 *
 * **`prefersReducedMotion()`**
 * - Returns: `boolean` - true if user prefers reduced motion
 *
 * **`useReducedMotion()`**
 * - React hook that tracks reduced motion preference
 * - Returns: `boolean`
 *
 * **`getAnimationDuration(normalDuration, reducedDuration)`**
 * - Returns appropriate duration based on preference
 * - Returns: `number`
 *
 * **`getTransitionClasses(normalClasses, reducedClasses)`**
 * - Returns appropriate CSS classes based on preference
 * - Returns: `string`
 *
 * **`onReducedMotionChange(callback)`**
 * - Listen for changes to motion preference
 * - Returns: Cleanup function
 *
 * **`injectReducedMotionCSS()`**
 * - Injects global CSS for reduced motion support
 * - Returns: Cleanup function
 *
 * ### 3. Theme Check Playground (`/playground/theme-check`)
 *
 * Interactive testing page that:
 * - Shows all three levels side-by-side
 * - Runs accessibility audits on each level
 * - Displays detailed reports with pass/fail status
 * - Provides visual comparison of themes
 *
 * #### Features
 *
 * - **Level Previews**: See basic, intermediate, and advanced side-by-side
 * - **Run Audits**: Test each level individually or all at once
 * - **Detailed Reports**: View contrast ratios, focus order, keyboard nav, and motion
 * - **Visual Indicators**: Color-coded pass/fail badges
 * - **Raw Output**: See complete audit reports
 *
 * ## WCAG AA Compliance
 *
 * ### Contrast Requirements
 *
 * - **Normal Text**: 4.5:1 minimum contrast ratio
 * - **Large Text**: 3:1 minimum contrast ratio (18pt+ or 14pt+ bold)
 * - **UI Components**: 3:1 minimum for interactive elements
 *
 * ### Focus Management
 *
 * - **Sequential Navigation**: Logical tab order without positive tabindex
 * - **Visible Focus**: Clear focus indicators on all interactive elements
 * - **Skip Links**: Keyboard shortcuts to main content
 * - **Landmarks**: ARIA landmarks for screen reader navigation
 *
 * ### Keyboard Navigation
 *
 * All interactive elements must be keyboard accessible:
 * - **Buttons**: Native `<button>` or `role="button"` with tabindex
 * - **Links**: Native `<a>` with href
 * - **Form Controls**: Native form elements
 * - **Custom Controls**: Proper ARIA roles and keyboard handlers
 *
 * #### Keyboard Patterns
 *
 * - **Tabs**: Arrow keys for navigation, Enter/Space to activate
 * - **Dialogs**: Escape to close, focus trap within modal
 * - **Menus**: Arrow keys for navigation, Enter to select
 * - **Grids**: Arrow keys for cell navigation, Enter to edit
 * - **Sliders**: Arrow keys to adjust value
 *
 * ### Reduced Motion
 *
 * Respect `prefers-reduced-motion: reduce`:
 * - Disable decorative animations
 * - Reduce essential animations to minimal duration
 * - Disable parallax and auto-playing videos
 * - Use instant transitions instead of animated ones
 *
 * ## Testing Workflow
 *
 * ### 1. Development Testing
 *
 * During development, use the accessibility checker:
 *
 * ```typescript
 * import { runAccessibilityAudit } from "@/polymet/data/accessibility-checker";
 *
 * // In your component or test
 * const report = runAccessibilityAudit(containerRef.current, "basic");
 *
 * if (!report.overallPass) {
 *   console.error("Accessibility issues found:", report);
 * }
 * ```
 *
 * ### 2. Manual Testing
 *
 * Visit `/playground/theme-check` to:
 * 1. View all three levels side-by-side
 * 2. Run audits on each level
 * 3. Review detailed reports
 * 4. Test keyboard navigation manually
 * 5. Toggle reduced motion in OS settings and retest
 *
 * ### 3. Automated Testing
 *
 * Add accessibility tests to your test suite:
 *
 * ```typescript
 * import { runAccessibilityAudit } from "@/polymet/data/accessibility-checker";
 * import { render } from "@testing-library/react";
 *
 * test("component meets WCAG AA standards", () => {
 *   const { container } = render(<MyComponent />);
 *   const report = runAccessibilityAudit(container, "basic");
 *
 *   expect(report.overallPass).toBe(true);
 *   expect(report.contrast.every(c => c.pass)).toBe(true);
 * });
 * ```
 *
 * ## Best Practices
 *
 * ### 1. Color Contrast
 *
 * ✅ **DO:**
 * - Use semantic color tokens (e.g., `text-foreground`, `bg-background`)
 * - Test custom colors with `checkContrast()`
 * - Provide sufficient contrast for all text
 *
 * ❌ **DON'T:**
 * - Use low-contrast color combinations
 * - Rely solely on color to convey information
 * - Use light gray text on white backgrounds
 *
 * ### 2. Focus Management
 *
 * ✅ **DO:**
 * - Use native HTML elements when possible
 * - Provide visible focus indicators
 * - Maintain logical tab order
 * - Add ARIA landmarks
 *
 * ❌ **DON'T:**
 * - Remove focus outlines without replacement
 * - Use positive tabindex values
 * - Create keyboard traps
 * - Skip interactive elements in tab order
 *
 * ### 3. Keyboard Navigation
 *
 * ✅ **DO:**
 * - Make all interactive elements keyboard accessible
 * - Implement standard keyboard patterns
 * - Provide keyboard shortcuts for common actions
 * - Add ARIA labels for screen readers
 *
 * ❌ **DON'T:**
 * - Require mouse for any functionality
 * - Use `onClick` on non-interactive elements without keyboard support
 * - Create custom controls without keyboard handlers
 * - Forget to test with keyboard only
 *
 * ### 4. Reduced Motion
 *
 * ✅ **DO:**
 * - Use `useReducedMotion()` hook
 * - Disable decorative animations
 * - Provide instant alternatives
 * - Test with OS setting enabled
 *
 * ❌ **DON'T:**
 * - Ignore motion preferences
 * - Use auto-playing animations
 * - Create motion-dependent interactions
 * - Assume all users want animations
 *
 * ## Component Guidelines
 *
 * ### Wizard Components
 *
 * - **Sequential Focus**: Tab through steps in order
 * - **Step Indicators**: Clear visual progress
 * - **Keyboard Shortcuts**: Enter to continue, Escape to cancel
 * - **ARIA Labels**: Describe current step and total steps
 *
 * ### Scenario Panels
 *
 * - **Landmarks**: Use `<section>` with `aria-label`
 * - **Collapsible**: Space/Enter to toggle
 * - **Form Controls**: All inputs keyboard accessible
 * - **Grid Navigation**: Arrow keys for matrix cells
 *
 * ### Expert Workbench
 *
 * - **Split Panes**: Keyboard resize with arrow keys
 * - **Tabs**: Arrow keys for navigation
 * - **Matrix Cells**: Grid pattern with arrow keys
 * - **Sliders**: Arrow keys for value adjustment
 *
 * ## Troubleshooting
 *
 * ### Low Contrast Ratios
 *
 * **Problem**: Text fails contrast checks
 *
 * **Solution**:
 * 1. Use semantic color tokens
 * 2. Increase color difference
 * 3. Test with `checkContrast()`
 * 4. Consider dark mode separately
 *
 * ### Focus Order Issues
 *
 * **Problem**: Tab order is illogical
 *
 * **Solution**:
 * 1. Remove positive tabindex values
 * 2. Reorder DOM elements
 * 3. Use CSS for visual layout
 * 4. Test with keyboard only
 *
 * ### Keyboard Navigation Failures
 *
 * **Problem**: Elements not keyboard accessible
 *
 * **Solution**:
 * 1. Use native HTML elements
 * 2. Add `tabindex="0"` to custom controls
 * 3. Implement keyboard event handlers
 * 4. Add ARIA roles and labels
 *
 * ### Reduced Motion Not Working
 *
 * **Problem**: Animations still running
 *
 * **Solution**:
 * 1. Import `@/polymet/data/reduced-motion-support`
 * 2. Use `useReducedMotion()` hook
 * 3. Apply conditional classes
 * 4. Test with OS setting enabled
 *
 * ## Resources
 *
 * - [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
 * - [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
 * - [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
 * - [Keyboard Accessibility](https://webaim.org/techniques/keyboard/)
 * - [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
 *
 * ## Acceptance Criteria
 *
 * ✅ All contrast checks pass WCAG AA (4.5:1 for normal text)
 * ✅ Focus order is sequential in wizard
 * ✅ Scenario panels use proper landmarks
 * ✅ All interactive elements keyboard accessible
 * ✅ Panes, tabs, matrix cells, sliders reachable via keyboard
 * ✅ Reduced motion preference respected
 * ✅ Playground renders three levels side-by-side
 * ✅ Automated checks run successfully
 *
 * ## Changelog
 *
 * ### v1.0.0 - Initial Release
 *
 * - ✅ Accessibility checker with WCAG AA validation
 * - ✅ Reduced motion support utilities
 * - ✅ Theme check playground page
 * - ✅ Automated contrast checking
 * - ✅ Focus order validation
 * - ✅ Keyboard navigation checks
 * - ✅ Reduced motion detection
 * - ✅ Side-by-side level comparison
 * - ✅ Detailed audit reports
 * - ✅ Visual pass/fail indicators
 */

export const ACCESSIBILITY_SYSTEM_VERSION = "1.0.0";

export const WCAG_AA_STANDARDS = {
  normalText: 4.5,
  largeText: 3.0,
  uiComponents: 3.0,
} as const;

export const KEYBOARD_PATTERNS = {
  tabs: "Arrow keys for navigation, Enter/Space to activate",
  dialogs: "Escape to close, focus trap within modal",
  menus: "Arrow keys for navigation, Enter to select",
  grids: "Arrow keys for cell navigation, Enter to edit",
  sliders: "Arrow keys to adjust value",
} as const;

export const TESTING_CHECKLIST = [
  "Run accessibility audit on all three levels",
  "Test keyboard navigation without mouse",
  "Verify focus indicators are visible",
  "Check contrast ratios for all text",
  "Test with reduced motion enabled",
  "Validate ARIA landmarks and labels",
  "Test screen reader compatibility",
  "Verify tab order is logical",
  "Test form controls with keyboard",
  "Check color is not sole indicator",
] as const;
