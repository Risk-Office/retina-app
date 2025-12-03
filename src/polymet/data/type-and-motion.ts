/**
 * Type and Motion Tokens
 *
 * Provides cohesive typography and animation tokens across three interface levels:
 * - Basic: Gentle, spacious, beginner-friendly
 * - Intermediate: Balanced, professional
 * - Advanced: Dense, efficient, expert-focused
 *
 * Design Philosophy:
 * - Single icon set (lucide-react) with size/weight variations only
 * - Consistent font stacks per level for cohesive feel
 * - Progressive motion speeds: slower for basic, faster for advanced
 * - No layout shift between levels (relative sizing)
 */

export type ThemeLevel = "basic" | "intermediate" | "advanced";

/**
 * Font Stack Definitions
 *
 * Each level uses a distinct but harmonious font stack:
 * - Basic: Inter/SF Pro - friendly, modern, highly legible
 * - Intermediate: Segoe UI/IBM Plex Sans - professional, balanced
 * - Advanced: IBM Plex Sans/Source Sans - technical, efficient
 */
export const fontStacks = {
  basic: {
    sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", monospace',
  },
  intermediate: {
    sans: '"Segoe UI", "IBM Plex Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    mono: '"IBM Plex Mono", "Consolas", "Monaco", monospace',
  },
  advanced: {
    sans: '"IBM Plex Sans", "Source Sans Pro", -apple-system, BlinkMacSystemFont, sans-serif',
    mono: '"Source Code Pro", "IBM Plex Mono", "Consolas", monospace',
  },
} as const;

/**
 * Typography Scale
 *
 * Relative sizing ensures no layout shift between levels.
 * Each level adjusts base size and line-height for optimal density.
 */
export const typeScale = {
  basic: {
    // Spacious, comfortable reading
    baseFontSize: "16px",
    baseLineHeight: 1.6,
    headings: {
      h1: {
        size: "2.25rem",
        weight: 700,
        lineHeight: 1.2,
        letterSpacing: "-0.02em",
      },
      h2: {
        size: "1.875rem",
        weight: 600,
        lineHeight: 1.3,
        letterSpacing: "-0.01em",
      },
      h3: { size: "1.5rem", weight: 600, lineHeight: 1.4, letterSpacing: "0" },
      h4: { size: "1.25rem", weight: 600, lineHeight: 1.4, letterSpacing: "0" },
      h5: {
        size: "1.125rem",
        weight: 600,
        lineHeight: 1.5,
        letterSpacing: "0",
      },
      h6: { size: "1rem", weight: 600, lineHeight: 1.5, letterSpacing: "0" },
    },
    body: {
      large: { size: "1.125rem", weight: 400, lineHeight: 1.6 },
      base: { size: "1rem", weight: 400, lineHeight: 1.6 },
      small: { size: "0.875rem", weight: 400, lineHeight: 1.5 },
      xs: { size: "0.75rem", weight: 400, lineHeight: 1.4 },
    },
  },
  intermediate: {
    // Balanced, professional
    baseFontSize: "15px",
    baseLineHeight: 1.5,
    headings: {
      h1: {
        size: "2rem",
        weight: 700,
        lineHeight: 1.2,
        letterSpacing: "-0.02em",
      },
      h2: {
        size: "1.75rem",
        weight: 600,
        lineHeight: 1.3,
        letterSpacing: "-0.01em",
      },
      h3: {
        size: "1.375rem",
        weight: 600,
        lineHeight: 1.4,
        letterSpacing: "0",
      },
      h4: {
        size: "1.125rem",
        weight: 600,
        lineHeight: 1.4,
        letterSpacing: "0",
      },
      h5: { size: "1rem", weight: 600, lineHeight: 1.5, letterSpacing: "0" },
      h6: {
        size: "0.875rem",
        weight: 600,
        lineHeight: 1.5,
        letterSpacing: "0",
      },
    },
    body: {
      large: { size: "1rem", weight: 400, lineHeight: 1.5 },
      base: { size: "0.9375rem", weight: 400, lineHeight: 1.5 },
      small: { size: "0.8125rem", weight: 400, lineHeight: 1.4 },
      xs: { size: "0.6875rem", weight: 400, lineHeight: 1.4 },
    },
  },
  advanced: {
    // Dense, efficient
    baseFontSize: "14px",
    baseLineHeight: 1.4,
    headings: {
      h1: {
        size: "1.75rem",
        weight: 700,
        lineHeight: 1.2,
        letterSpacing: "-0.01em",
      },
      h2: {
        size: "1.5rem",
        weight: 600,
        lineHeight: 1.3,
        letterSpacing: "-0.01em",
      },
      h3: { size: "1.25rem", weight: 600, lineHeight: 1.3, letterSpacing: "0" },
      h4: { size: "1rem", weight: 600, lineHeight: 1.4, letterSpacing: "0" },
      h5: {
        size: "0.875rem",
        weight: 600,
        lineHeight: 1.4,
        letterSpacing: "0",
      },
      h6: { size: "0.75rem", weight: 600, lineHeight: 1.4, letterSpacing: "0" },
    },
    body: {
      large: { size: "0.9375rem", weight: 400, lineHeight: 1.4 },
      base: { size: "0.875rem", weight: 400, lineHeight: 1.4 },
      small: { size: "0.75rem", weight: 400, lineHeight: 1.3 },
      xs: { size: "0.625rem", weight: 400, lineHeight: 1.3 },
    },
  },
} as const;

/**
 * Icon Sizing
 *
 * Single icon set (lucide-react) with size variations only.
 * Maintains visual consistency while adapting to density.
 */
export const iconSizes = {
  basic: {
    xs: 14,
    sm: 16,
    base: 20,
    lg: 24,
    xl: 28,
    "2xl": 32,
  },
  intermediate: {
    xs: 12,
    sm: 14,
    base: 18,
    lg: 22,
    xl: 26,
    "2xl": 30,
  },
  advanced: {
    xs: 10,
    sm: 12,
    base: 16,
    lg: 20,
    xl: 24,
    "2xl": 28,
  },
} as const;

/**
 * Icon Stroke Width
 *
 * Subtle weight variations for visual hierarchy.
 */
export const iconStrokeWidth = {
  basic: {
    thin: 1.5,
    regular: 2,
    medium: 2.25,
    bold: 2.5,
  },
  intermediate: {
    thin: 1.5,
    regular: 2,
    medium: 2.25,
    bold: 2.5,
  },
  advanced: {
    thin: 1.25,
    regular: 1.75,
    medium: 2,
    bold: 2.25,
  },
} as const;

/**
 * Motion Timing
 *
 * Progressive speeds: slower for basic (gentle), faster for advanced (efficient).
 * Standard easing for natural feel.
 */
export const motionTiming = {
  basic: {
    instant: "50ms",
    fast: "150ms",
    base: "225ms",
    slow: "300ms",
    slower: "400ms",
  },
  intermediate: {
    instant: "50ms",
    fast: "125ms",
    base: "175ms",
    slow: "250ms",
    slower: "350ms",
  },
  advanced: {
    instant: "50ms",
    fast: "100ms",
    base: "125ms",
    slow: "200ms",
    slower: "300ms",
  },
} as const;

/**
 * Easing Functions
 *
 * Standard easing curves for natural motion.
 * Consistent across all levels for cohesive feel.
 */
export const easingFunctions = {
  standard: "cubic-bezier(0.4, 0.0, 0.2, 1)",
  decelerate: "cubic-bezier(0.0, 0.0, 0.2, 1)",
  accelerate: "cubic-bezier(0.4, 0.0, 1, 1)",
  sharp: "cubic-bezier(0.4, 0.0, 0.6, 1)",
  bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
} as const;

/**
 * Animation Presets
 *
 * Common animation patterns with level-appropriate timing.
 */
export const animationPresets = {
  basic: {
    fadeIn: `opacity 225ms cubic-bezier(0.4, 0.0, 0.2, 1)`,
    fadeOut: `opacity 225ms cubic-bezier(0.4, 0.0, 0.2, 1)`,
    slideIn: `transform 225ms cubic-bezier(0.4, 0.0, 0.2, 1)`,
    slideOut: `transform 225ms cubic-bezier(0.4, 0.0, 0.2, 1)`,
    scale: `transform 225ms cubic-bezier(0.4, 0.0, 0.2, 1)`,
    expand: `all 225ms cubic-bezier(0.4, 0.0, 0.2, 1)`,
  },
  intermediate: {
    fadeIn: `opacity 175ms cubic-bezier(0.4, 0.0, 0.2, 1)`,
    fadeOut: `opacity 175ms cubic-bezier(0.4, 0.0, 0.2, 1)`,
    slideIn: `transform 175ms cubic-bezier(0.4, 0.0, 0.2, 1)`,
    slideOut: `transform 175ms cubic-bezier(0.4, 0.0, 0.2, 1)`,
    scale: `transform 175ms cubic-bezier(0.4, 0.0, 0.2, 1)`,
    expand: `all 175ms cubic-bezier(0.4, 0.0, 0.2, 1)`,
  },
  advanced: {
    fadeIn: `opacity 125ms cubic-bezier(0.4, 0.0, 0.2, 1)`,
    fadeOut: `opacity 125ms cubic-bezier(0.4, 0.0, 0.2, 1)`,
    slideIn: `transform 125ms cubic-bezier(0.4, 0.0, 0.2, 1)`,
    slideOut: `transform 125ms cubic-bezier(0.4, 0.0, 0.2, 1)`,
    scale: `transform 125ms cubic-bezier(0.4, 0.0, 0.2, 1)`,
    expand: `all 125ms cubic-bezier(0.4, 0.0, 0.2, 1)`,
  },
} as const;

/**
 * Helper: Get heading styles
 *
 * @param level - Interface level (basic/intermediate/advanced)
 * @param size - Heading size (h1-h6)
 * @returns CSS-in-JS style object
 */
export function heading(
  level: ThemeLevel,
  size: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
) {
  const scale = typeScale[level];
  const headingStyle = scale.headings[size];
  const fontStack = fontStacks[level];

  return {
    fontFamily: fontStack.sans,
    fontSize: headingStyle.size,
    fontWeight: headingStyle.weight,
    lineHeight: headingStyle.lineHeight,
    letterSpacing: headingStyle.letterSpacing,
  };
}

/**
 * Helper: Get body text styles
 *
 * @param level - Interface level (basic/intermediate/advanced)
 * @param size - Body size (large/base/small/xs)
 * @returns CSS-in-JS style object
 */
export function body(
  level: ThemeLevel,
  size: "large" | "base" | "small" | "xs" = "base"
) {
  const scale = typeScale[level];
  const bodyStyle = scale.body[size];
  const fontStack = fontStacks[level];

  return {
    fontFamily: fontStack.sans,
    fontSize: bodyStyle.size,
    fontWeight: bodyStyle.weight,
    lineHeight: bodyStyle.lineHeight,
  };
}

/**
 * Helper: Get animation styles
 *
 * @param level - Interface level (basic/intermediate/advanced)
 * @param kind - Animation kind (fadeIn/fadeOut/slideIn/slideOut/scale/expand)
 * @returns CSS transition string
 */
export function anim(
  level: ThemeLevel,
  kind: "fadeIn" | "fadeOut" | "slideIn" | "slideOut" | "scale" | "expand"
): string {
  return animationPresets[level][kind];
}

/**
 * Helper: Get icon size
 *
 * @param level - Interface level (basic/intermediate/advanced)
 * @param size - Icon size (xs/sm/base/lg/xl/2xl)
 * @returns Icon size in pixels
 */
export function iconSize(
  level: ThemeLevel,
  size: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" = "base"
): number {
  return iconSizes[level][size];
}

/**
 * Helper: Get icon stroke width
 *
 * @param level - Interface level (basic/intermediate/advanced)
 * @param weight - Stroke weight (thin/regular/medium/bold)
 * @returns Stroke width value
 */
export function iconStroke(
  level: ThemeLevel,
  weight: "thin" | "regular" | "medium" | "bold" = "regular"
): number {
  return iconStrokeWidth[level][weight];
}

/**
 * Helper: Get motion timing
 *
 * @param level - Interface level (basic/intermediate/advanced)
 * @param speed - Speed preset (instant/fast/base/slow/slower)
 * @returns Duration string (e.g., "225ms")
 */
export function motion(
  level: ThemeLevel,
  speed: "instant" | "fast" | "base" | "slow" | "slower" = "base"
): string {
  return motionTiming[level][speed];
}

/**
 * Helper: Get easing function
 *
 * @param type - Easing type (standard/decelerate/accelerate/sharp/bounce)
 * @returns Cubic bezier string
 */
export function easing(
  type:
    | "standard"
    | "decelerate"
    | "accelerate"
    | "sharp"
    | "bounce" = "standard"
): string {
  return easingFunctions[type];
}

/**
 * Helper: Create custom transition
 *
 * @param level - Interface level (basic/intermediate/advanced)
 * @param property - CSS property to transition
 * @param speed - Speed preset (instant/fast/base/slow/slower)
 * @param easingType - Easing type (standard/decelerate/accelerate/sharp/bounce)
 * @returns CSS transition string
 */
export function transition(
  level: ThemeLevel,
  property: string,
  speed: "instant" | "fast" | "base" | "slow" | "slower" = "base",
  easingType:
    | "standard"
    | "decelerate"
    | "accelerate"
    | "sharp"
    | "bounce" = "standard"
): string {
  return `${property} ${motionTiming[level][speed]} ${easingFunctions[easingType]}`;
}

/**
 * Helper: Get base font size for level
 *
 * @param level - Interface level (basic/intermediate/advanced)
 * @returns Base font size string
 */
export function baseFontSize(level: ThemeLevel): string {
  return typeScale[level].baseFontSize;
}

/**
 * Helper: Get base line height for level
 *
 * @param level - Interface level (basic/intermediate/advanced)
 * @returns Base line height value
 */
export function baseLineHeight(level: ThemeLevel): number {
  return typeScale[level].baseLineHeight;
}

/**
 * CSS Class Generator
 *
 * Generates Tailwind-compatible CSS classes for typography.
 * Use with className prop or cn() utility.
 */
export function headingClass(
  level: ThemeLevel,
  size: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
): string {
  const styles = heading(level, size);
  // Return semantic class names that can be used with Tailwind
  const sizeMap = {
    h1: "text-4xl md:text-5xl",
    h2: "text-3xl md:text-4xl",
    h3: "text-2xl md:text-3xl",
    h4: "text-xl md:text-2xl",
    h5: "text-lg md:text-xl",
    h6: "text-base md:text-lg",
  };

  const weightMap = {
    700: "font-bold",
    600: "font-semibold",
    500: "font-medium",
    400: "font-normal",
  };

  return `${sizeMap[size]} ${weightMap[styles.fontWeight as keyof typeof weightMap] || "font-semibold"}`;
}

/**
 * CSS Class Generator for body text
 */
export function bodyClass(
  level: ThemeLevel,
  size: "large" | "base" | "small" | "xs" = "base"
): string {
  const sizeMap = {
    large: "text-lg",
    base: "text-base",
    small: "text-sm",
    xs: "text-xs",
  };

  return sizeMap[size];
}
