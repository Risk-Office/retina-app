/**
 * Type and Motion Tokens System
 *
 * A comprehensive typography and animation system that provides cohesive design
 * across three interface levels while maintaining visual consistency.
 *
 * ## Design Philosophy
 *
 * ### Cohesive Feel Despite Multiple Inspirations
 *
 * The system draws inspiration from multiple design systems but maintains cohesion through:
 *
 * 1. **Single Icon Set**: Uses lucide-react exclusively across all levels
 *    - Only size and stroke weight vary
 *    - No jarring visual changes between levels
 *
 * 2. **Harmonious Font Stacks**: Each level has a distinct but compatible font family
 *    - Basic: Inter/SF Pro (friendly, modern)
 *    - Intermediate: Segoe UI/IBM Plex Sans (professional)
 *    - Advanced: IBM Plex Sans/Source Sans (technical)
 *
 * 3. **Progressive Motion**: Speeds adapt to user expertise
 *    - Basic: 200-250ms (gentle, comfortable)
 *    - Intermediate: 150-200ms (balanced)
 *    - Advanced: 100-150ms (efficient, snappy)
 *
 * 4. **Standard Easing**: Consistent cubic-bezier curves across all levels
 *    - Maintains natural feel regardless of speed
 *
 * ## Typography System
 *
 * ### Font Stacks
 *
 * ```typescript
 * // Basic Level - Friendly & Modern
 * fontStacks.basic.sans = "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
 *
 * // Intermediate Level - Professional & Balanced
 * fontStacks.intermediate.sans = "Segoe UI, IBM Plex Sans, -apple-system, BlinkMacSystemFont, sans-serif"
 *
 * // Advanced Level - Technical & Efficient
 * fontStacks.advanced.sans = "IBM Plex Sans, Source Sans Pro, -apple-system, BlinkMacSystemFont, sans-serif"
 * ```
 *
 * ### Type Scale
 *
 * Each level has optimized sizing for its density:
 *
 * | Level        | Base Size | Line Height | Density  |
 * |--------------|-----------|-------------|----------|
 * | Basic        | 16px      | 1.6         | Spacious |
 * | Intermediate | 15px      | 1.5         | Balanced |
 * | Advanced     | 14px      | 1.4         | Dense    |
 *
 * ### Headings
 *
 * Six heading levels (h1-h6) with responsive sizing:
 *
 * ```typescript
 * // Example: H1 sizing across levels
 * basic.h1        = 2.25rem (36px)
 * intermediate.h1 = 2rem    (32px)
 * advanced.h1     = 1.75rem (28px)
 * ```
 *
 * ### Body Text
 *
 * Four body sizes (large/base/small/xs):
 *
 * ```typescript
 * // Example: Base body text
 * basic.base        = 1rem      (16px)
 * intermediate.base = 0.9375rem (15px)
 * advanced.base     = 0.875rem  (14px)
 * ```
 *
 * ## Iconography System
 *
 * ### Single Icon Set
 *
 * Uses lucide-react exclusively to avoid visual inconsistency:
 *
 * ```typescript
 * // Icon sizes adapt to level density
 * iconSize("basic", "base")        // 20px
 * iconSize("intermediate", "base") // 18px
 * iconSize("advanced", "base")     // 16px
 * ```
 *
 * ### Size Scale
 *
 * Six size options (xs/sm/base/lg/xl/2xl):
 *
 * | Size | Basic | Intermediate | Advanced |
 * |------|-------|--------------|----------|
 * | xs   | 14px  | 12px         | 10px     |
 * | sm   | 16px  | 14px         | 12px     |
 * | base | 20px  | 18px         | 16px     |
 * | lg   | 24px  | 22px         | 20px     |
 * | xl   | 28px  | 26px         | 24px     |
 * | 2xl  | 32px  | 30px         | 28px     |
 *
 * ### Stroke Weight
 *
 * Four weight options (thin/regular/medium/bold):
 *
 * ```typescript
 * // Subtle variations for hierarchy
 * iconStroke("basic", "regular")   // 2.0
 * iconStroke("advanced", "regular") // 1.75
 * ```
 *
 * ## Motion System
 *
 * ### Timing Scale
 *
 * Progressive speeds based on user expertise:
 *
 * | Speed   | Basic  | Intermediate | Advanced |
 * |---------|--------|--------------|----------|
 * | instant | 50ms   | 50ms         | 50ms     |
 * | fast    | 150ms  | 125ms        | 100ms    |
 * | base    | 225ms  | 175ms        | 125ms    |
 * | slow    | 300ms  | 250ms        | 200ms    |
 * | slower  | 400ms  | 350ms        | 300ms    |
 *
 * ### Easing Functions
 *
 * Standard cubic-bezier curves for natural motion:
 *
 * ```typescript
 * easing("standard")   // cubic-bezier(0.4, 0.0, 0.2, 1)
 * easing("decelerate") // cubic-bezier(0.0, 0.0, 0.2, 1)
 * easing("accelerate") // cubic-bezier(0.4, 0.0, 1, 1)
 * easing("sharp")      // cubic-bezier(0.4, 0.0, 0.6, 1)
 * easing("bounce")     // cubic-bezier(0.68, -0.55, 0.265, 1.55)
 * ```
 *
 * ### Animation Presets
 *
 * Common patterns with level-appropriate timing:
 *
 * ```typescript
 * anim("basic", "fadeIn")        // opacity 225ms cubic-bezier(...)
 * anim("intermediate", "fadeIn") // opacity 175ms cubic-bezier(...)
 * anim("advanced", "fadeIn")     // opacity 125ms cubic-bezier(...)
 * ```
 *
 * Available presets:
 * - fadeIn / fadeOut
 * - slideIn / slideOut
 * - scale
 * - expand
 *
 * ## Helper Functions
 *
 * ### Typography Helpers
 *
 * ```typescript
 * // Get heading styles
 * const h1Styles = heading("basic", "h1");
 * // Returns: { fontFamily, fontSize, fontWeight, lineHeight, letterSpacing }
 *
 * // Get body text styles
 * const bodyStyles = body("intermediate", "base");
 * // Returns: { fontFamily, fontSize, fontWeight, lineHeight }
 *
 * // Get Tailwind classes
 * const h1Class = headingClass("basic", "h1");
 * // Returns: "text-4xl md:text-5xl font-bold"
 *
 * const bodyClass = bodyClass("intermediate", "small");
 * // Returns: "text-sm"
 * ```
 *
 * ### Icon Helpers
 *
 * ```typescript
 * // Get icon size
 * const size = iconSize("advanced", "lg");
 * // Returns: 20
 *
 * // Get stroke width
 * const stroke = iconStroke("basic", "medium");
 * // Returns: 2.25
 *
 * // Usage with lucide-react
 * <ZapIcon size={iconSize(level, "base")} strokeWidth={iconStroke(level, "regular")} />
 * ```
 *
 * ### Motion Helpers
 *
 * ```typescript
 * // Get animation preset
 * const fadeAnimation = anim("intermediate", "fadeIn");
 * // Returns: "opacity 175ms cubic-bezier(0.4, 0.0, 0.2, 1)"
 *
 * // Get duration
 * const duration = motion("advanced", "fast");
 * // Returns: "100ms"
 *
 * // Get easing
 * const easingCurve = easing("standard");
 * // Returns: "cubic-bezier(0.4, 0.0, 0.2, 1)"
 *
 * // Create custom transition
 * const customTransition = transition("basic", "transform", "slow", "bounce");
 * // Returns: "transform 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55)"
 * ```
 *
 * ### Base Settings Helpers
 *
 * ```typescript
 * // Get base font size
 * const baseSize = baseFontSize("intermediate");
 * // Returns: "15px"
 *
 * // Get base line height
 * const lineHeight = baseLineHeight("advanced");
 * // Returns: 1.4
 * ```
 *
 * ## Usage Examples
 *
 * ### With Theme Provider
 *
 * ```typescript
 * import { heading, body, anim, iconSize } from "@/polymet/data/type-and-motion";
 * import { useTheme } from "@/polymet/components/theme-provider";
 *
 * function MyComponent() {
 *   const { level } = useTheme();
 *
 *   return (
 *     <div>
 *       <h1 style={heading(level, "h1")}>
 *         Adaptive Heading
 *       </h1>
 *       <p style={body(level, "base")}>
 *         This text scales with the interface level
 *       </p>
 *       <div style={{ transition: anim(level, "fadeIn") }}>
 *         Animated content
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 *
 * ### With Tailwind Classes
 *
 * ```typescript
 * import { headingClass, bodyClass } from "@/polymet/data/type-and-motion";
 * import { useTheme } from "@/polymet/components/theme-provider";
 *
 * function MyComponent() {
 *   const { level } = useTheme();
 *
 *   return (
 *     <div>
 *       <h1 className={headingClass(level, "h1")}>
 *         Adaptive Heading
 *       </h1>
 *       <p className={bodyClass(level, "base")}>
 *         Body text with Tailwind
 *       </p>
 *     </div>
 *   );
 * }
 * ```
 *
 * ### With Icons
 *
 * ```typescript
 * import { iconSize, iconStroke } from "@/polymet/data/type-and-motion";
 * import { useTheme } from "@/polymet/components/theme-provider";
 * import { ZapIcon, SettingsIcon } from "lucide-react";
 *
 * function MyComponent() {
 *   const { level } = useTheme();
 *
 *   return (
 *     <div>
 *       <ZapIcon
 *         size={iconSize(level, "base")}
 *         strokeWidth={iconStroke(level, "regular")}
 *       />
 *       <SettingsIcon
 *         size={iconSize(level, "lg")}
 *         strokeWidth={iconStroke(level, "bold")}
 *       />
 *     </div>
 *   );
 * }
 * ```
 *
 * ### With Custom Transitions
 *
 * ```typescript
 * import { transition, motion, easing } from "@/polymet/data/type-and-motion";
 * import { useTheme } from "@/polymet/components/theme-provider";
 *
 * function MyComponent() {
 *   const { level } = useTheme();
 *
 *   return (
 *     <div
 *       style={{
 *         transition: transition(level, "all", "base", "standard"),
 *       }}
 *     >
 *       Smoothly animated
 *     </div>
 *   );
 * }
 * ```
 *
 * ## Acceptance Criteria
 *
 * ✅ **Motion scales by level**: Basic (200-250ms), Intermediate (150-200ms), Advanced (100-150ms)
 *
 * ✅ **Text scales by level**: Basic (16px base), Intermediate (15px base), Advanced (14px base)
 *
 * ✅ **No layout shift**: Relative sizing ensures consistent layout structure
 *
 * ✅ **Single icon set**: lucide-react used exclusively with size/weight variations
 *
 * ✅ **Standard easing**: cubic-bezier curves consistent across all levels
 *
 * ✅ **Helper functions**: heading(), body(), anim() provide easy access to tokens
 *
 * ## Integration with Theme System
 *
 * The type and motion tokens integrate seamlessly with the existing theme system:
 *
 * ```typescript
 * import { useTheme } from "@/polymet/components/theme-provider";
 * import { heading, anim } from "@/polymet/data/type-and-motion";
 *
 * function MyComponent() {
 *   const { level } = useTheme(); // "basic" | "intermediate" | "advanced"
 *
 *   // Typography automatically adapts
 *   const h1Styles = heading(level, "h1");
 *
 *   // Animations automatically adapt
 *   const fadeIn = anim(level, "fadeIn");
 *
 *   return (
 *     <div>
 *       <h1 style={h1Styles}>Adaptive Typography</h1>
 *       <div style={{ transition: fadeIn }}>Adaptive Motion</div>
 *     </div>
 *   );
 * }
 * ```
 *
 * ## Best Practices
 *
 * 1. **Always use helper functions**: Don't hardcode sizes or durations
 * 2. **Respect the level**: Let the theme provider determine the level
 * 3. **Use semantic sizing**: Prefer "base" over specific pixel values
 * 4. **Maintain icon consistency**: Always use lucide-react icons
 * 5. **Test across levels**: Ensure your component works at all three levels
 * 6. **Avoid layout shift**: Use relative units and consistent spacing
 *
 * ## Performance Considerations
 *
 * - All tokens are compile-time constants (no runtime overhead)
 * - Helper functions are pure and can be memoized
 * - CSS transitions are hardware-accelerated
 * - Font stacks include system fallbacks for fast loading
 *
 * ## Future Enhancements
 *
 * - [ ] Add support for reduced motion preferences
 * - [ ] Add dark mode specific adjustments
 * - [ ] Add print-specific typography
 * - [ ] Add accessibility contrast helpers
 * - [ ] Add responsive breakpoint helpers
 */

export const TYPE_AND_MOTION_README =
  "See code comments for full documentation";
