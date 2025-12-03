/**
 * Accessibility Checker
 *
 * Automated checks for:
 * - WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text)
 * - Focus order validation
 * - Keyboard navigation
 * - Reduced motion support
 */

export interface ContrastCheckResult {
  pass: boolean;
  ratio: number;
  required: number;
  foreground: string;
  background: string;
  context: string;
}

export interface FocusOrderCheckResult {
  pass: boolean;
  issues: string[];
  focusableElements: number;
}

export interface KeyboardNavCheckResult {
  pass: boolean;
  issues: string[];
  testedElements: string[];
}

export interface ReducedMotionCheckResult {
  pass: boolean;
  respectsPreference: boolean;
  animatedElements: number;
}

export interface AccessibilityReport {
  contrast: ContrastCheckResult[];
  focusOrder: FocusOrderCheckResult;
  keyboardNav: KeyboardNavCheckResult;
  reducedMotion: ReducedMotionCheckResult;
  overallPass: boolean;
  timestamp: number;
}

/**
 * Calculate relative luminance for a color
 * https://www.w3.org/TR/WCAG20-TECHS/G17.html
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928
      ? sRGB / 12.92
      : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Parse CSS color to RGB
 */
function parseColor(color: string): { r: number; g: number; b: number } | null {
  // Handle hex colors
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
      };
    }
    if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
      };
    }
  }

  // Handle rgb/rgba
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]),
      g: parseInt(rgbMatch[2]),
      b: parseInt(rgbMatch[3]),
    };
  }

  // Handle hsl - convert to RGB
  const hslMatch = color.match(/hsla?\((\d+),\s*(\d+)%,\s*(\d+)%/);
  if (hslMatch) {
    const h = parseInt(hslMatch[1]) / 360;
    const s = parseInt(hslMatch[2]) / 100;
    const l = parseInt(hslMatch[3]) / 100;

    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    };
  }

  return null;
}

/**
 * Calculate contrast ratio between two colors
 * https://www.w3.org/TR/WCAG20-TECHS/G18.html
 */
export function getContrastRatio(
  foreground: string,
  background: string
): number {
  const fg = parseColor(foreground);
  const bg = parseColor(background);

  if (!fg || !bg) {
    console.warn("Could not parse colors:", { foreground, background });
    return 0;
  }

  const l1 = getLuminance(fg.r, fg.g, fg.b);
  const l2 = getLuminance(bg.r, bg.g, bg.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standards
 */
export function checkContrast(
  foreground: string,
  background: string,
  isLargeText: boolean = false,
  context: string = ""
): ContrastCheckResult {
  const ratio = getContrastRatio(foreground, background);
  const required = isLargeText ? 3.0 : 4.5;

  return {
    pass: ratio >= required,
    ratio: Math.round(ratio * 100) / 100,
    required,
    foreground,
    background,
    context,
  };
}

/**
 * Check contrast for theme tokens
 */
export function checkThemeTokenContrast(
  level: "basic" | "intermediate" | "advanced"
): ContrastCheckResult[] {
  const results: ContrastCheckResult[] = [];

  // Get computed styles from root
  const root = document.documentElement;
  const styles = getComputedStyle(root);

  // Check common text/background combinations
  const checks = [
    { fg: "--foreground", bg: "--background", context: "Body text" },
    { fg: "--primary-foreground", bg: "--primary", context: "Primary button" },
    {
      fg: "--secondary-foreground",
      bg: "--secondary",
      context: "Secondary button",
    },
    { fg: "--muted-foreground", bg: "--muted", context: "Muted text" },
    { fg: "--accent-foreground", bg: "--accent", context: "Accent text" },
    { fg: "--card-foreground", bg: "--card", context: "Card text" },
    { fg: "--popover-foreground", bg: "--popover", context: "Popover text" },
  ];

  checks.forEach(({ fg, bg, context }) => {
    const fgColor = styles.getPropertyValue(fg);
    const bgColor = styles.getPropertyValue(bg);

    if (fgColor && bgColor) {
      // Convert HSL to actual color
      const fgHsl = `hsl(${fgColor})`;
      const bgHsl = `hsl(${bgColor})`;

      results.push(checkContrast(fgHsl, bgHsl, false, `${context} (${level})`));
    }
  });

  return results;
}

/**
 * Check focus order in wizard
 */
export function checkFocusOrder(container: HTMLElement): FocusOrderCheckResult {
  const focusableSelectors = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
  ];

  const focusableElements = Array.from(
    container.querySelectorAll(focusableSelectors.join(", "))
  ) as HTMLElement[];

  const issues: string[] = [];

  // Check sequential tab order
  const tabIndexes = focusableElements.map((el) => {
    const tabIndex = el.getAttribute("tabindex");
    return tabIndex ? parseInt(tabIndex) : 0;
  });

  // Check for positive tabindex (anti-pattern)
  const positiveTabIndexes = tabIndexes.filter((idx) => idx > 0);
  if (positiveTabIndexes.length > 0) {
    issues.push(
      `Found ${positiveTabIndexes.length} elements with positive tabindex (anti-pattern)`
    );
  }

  // Check for landmarks
  const landmarks = container.querySelectorAll(
    '[role="region"], [role="navigation"], section, nav'
  );
  if (landmarks.length === 0) {
    issues.push("No ARIA landmarks found for screen reader navigation");
  }

  return {
    pass: issues.length === 0,
    issues,
    focusableElements: focusableElements.length,
  };
}

/**
 * Check keyboard navigation
 */
export function checkKeyboardNav(
  container: HTMLElement
): KeyboardNavCheckResult {
  const issues: string[] = [];
  const testedElements: string[] = [];

  // Check for interactive elements without keyboard support
  const interactiveSelectors = [
    "[onclick]",
    '[role="button"]',
    '[role="tab"]',
    '[role="slider"]',
    ".cursor-pointer",
  ];

  interactiveSelectors.forEach((selector) => {
    const elements = container.querySelectorAll(selector);
    elements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      const tagName = htmlEl.tagName.toLowerCase();
      const role = htmlEl.getAttribute("role");
      const tabIndex = htmlEl.getAttribute("tabindex");

      testedElements.push(`${tagName}${role ? `[role="${role}"]` : ""}`);

      // Check if element is keyboard accessible
      if (tagName !== "button" && tagName !== "a" && tabIndex === null) {
        issues.push(
          `Element ${tagName}${role ? ` with role="${role}"` : ""} is not keyboard accessible`
        );
      }

      // Check for ARIA labels
      const hasLabel =
        htmlEl.getAttribute("aria-label") ||
        htmlEl.getAttribute("aria-labelledby") ||
        htmlEl.textContent?.trim();

      if (!hasLabel) {
        issues.push(
          `Element ${tagName}${role ? ` with role="${role}"` : ""} has no accessible label`
        );
      }
    });
  });

  // Check for matrix cells (grid pattern)
  const gridCells = container.querySelectorAll('[role="gridcell"]');
  if (gridCells.length > 0) {
    gridCells.forEach((cell) => {
      const htmlCell = cell as HTMLElement;
      if (!htmlCell.hasAttribute("tabindex")) {
        issues.push("Grid cell missing tabindex for keyboard navigation");
      }
    });
  }

  return {
    pass: issues.length === 0,
    issues,
    testedElements: [...new Set(testedElements)],
  };
}

/**
 * Check reduced motion support
 */
export function checkReducedMotion(
  container: HTMLElement
): ReducedMotionCheckResult {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  // Check for animated elements
  const animatedElements = container.querySelectorAll(
    '[class*="animate-"], [class*="transition-"]'
  );

  let respectsPreference = true;

  if (prefersReducedMotion && animatedElements.length > 0) {
    // Check if animations are disabled
    animatedElements.forEach((el) => {
      const styles = getComputedStyle(el as HTMLElement);
      const animationDuration = styles.animationDuration;
      const transitionDuration = styles.transitionDuration;

      // If animations are still running, preference is not respected
      if (
        (animationDuration && animationDuration !== "0s") ||
        (transitionDuration && transitionDuration !== "0s")
      ) {
        respectsPreference = false;
      }
    });
  }

  return {
    pass: !prefersReducedMotion || respectsPreference,
    respectsPreference,
    animatedElements: animatedElements.length,
  };
}

/**
 * Run full accessibility audit
 */
export function runAccessibilityAudit(
  container: HTMLElement,
  level: "basic" | "intermediate" | "advanced"
): AccessibilityReport {
  const contrast = checkThemeTokenContrast(level);
  const focusOrder = checkFocusOrder(container);
  const keyboardNav = checkKeyboardNav(container);
  const reducedMotion = checkReducedMotion(container);

  const overallPass =
    contrast.every((c) => c.pass) &&
    focusOrder.pass &&
    keyboardNav.pass &&
    reducedMotion.pass;

  return {
    contrast,
    focusOrder,
    keyboardNav,
    reducedMotion,
    overallPass,
    timestamp: Date.now(),
  };
}

/**
 * Format accessibility report for display
 */
export function formatAccessibilityReport(report: AccessibilityReport): string {
  let output = "=== Accessibility Audit Report ===\n\n";

  // Contrast checks
  output += "CONTRAST CHECKS (WCAG AA):\n";
  report.contrast.forEach((check) => {
    const status = check.pass ? "✓ PASS" : "✗ FAIL";
    output += `  ${status} ${check.context}: ${check.ratio}:1 (required: ${check.required}:1)\n`;
  });
  output += "\n";

  // Focus order
  output += "FOCUS ORDER:\n";
  output += `  ${report.focusOrder.pass ? "✓ PASS" : "✗ FAIL"}\n`;
  output += `  Focusable elements: ${report.focusOrder.focusableElements}\n`;
  if (report.focusOrder.issues.length > 0) {
    output += "  Issues:\n";
    report.focusOrder.issues.forEach((issue) => {
      output += `    - ${issue}\n`;
    });
  }
  output += "\n";

  // Keyboard navigation
  output += "KEYBOARD NAVIGATION:\n";
  output += `  ${report.keyboardNav.pass ? "✓ PASS" : "✗ FAIL"}\n`;
  output += `  Tested elements: ${report.keyboardNav.testedElements.join(", ")}\n`;
  if (report.keyboardNav.issues.length > 0) {
    output += "  Issues:\n";
    report.keyboardNav.issues.forEach((issue) => {
      output += `    - ${issue}\n`;
    });
  }
  output += "\n";

  // Reduced motion
  output += "REDUCED MOTION:\n";
  output += `  ${report.reducedMotion.pass ? "✓ PASS" : "✗ FAIL"}\n`;
  output += `  Respects preference: ${report.reducedMotion.respectsPreference ? "Yes" : "No"}\n`;
  output += `  Animated elements: ${report.reducedMotion.animatedElements}\n`;
  output += "\n";

  output += `OVERALL: ${report.overallPass ? "✓ ALL CHECKS PASSED" : "✗ SOME CHECKS FAILED"}\n`;

  return output;
}
