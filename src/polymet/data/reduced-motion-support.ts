/**
 * Reduced Motion Support
 *
 * Utilities for respecting user's prefers-reduced-motion preference
 * and providing accessible animation controls
 */

/**
 * CSS rules for reduced motion
 * These rules disable or reduce animations when user prefers reduced motion
 */
export const REDUCED_MOTION_CSS = `
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }

    /* Preserve essential animations but make them instant */
    [data-essential-animation] {
      animation-duration: 0.01ms !important;
    }

    /* Disable decorative animations completely */
    [data-decorative-animation] {
      animation: none !important;
    }
  }
`;

/**
 * Inject reduced motion CSS into the document
 */
export function injectReducedMotionCSS(): () => void {
  const styleId = "reduced-motion-support";

  // Check if already injected
  if (document.getElementById(styleId)) {
    return () => {}; // No-op cleanup
  }

  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = REDUCED_MOTION_CSS;
  document.head.appendChild(style);

  // Return cleanup function
  return () => {
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      existingStyle.remove();
    }
  };
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Listen for changes to reduced motion preference
 */
export function onReducedMotionChange(
  callback: (prefersReduced: boolean) => void
): () => void {
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches);
  };

  // Modern browsers
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }

  // Legacy browsers
  mediaQuery.addListener(handler);
  return () => mediaQuery.removeListener(handler);
}

/**
 * Get animation duration based on reduced motion preference
 */
export function getAnimationDuration(
  normalDuration: number,
  reducedDuration: number = 0
): number {
  return prefersReducedMotion() ? reducedDuration : normalDuration;
}

/**
 * Get transition classes based on reduced motion preference
 */
export function getTransitionClasses(
  normalClasses: string,
  reducedClasses: string = ""
): string {
  return prefersReducedMotion() ? reducedClasses : normalClasses;
}

/**
 * React hook for reduced motion preference
 */
export function useReducedMotion(): boolean {
  if (typeof window === "undefined") return false;

  const [prefersReduced, setPrefersReduced] = React.useState(
    prefersReducedMotion()
  );

  React.useEffect(() => {
    const cleanup = onReducedMotionChange(setPrefersReduced);
    return cleanup;
  }, []);

  return prefersReduced;
}

// Auto-inject CSS on module load
if (typeof window !== "undefined") {
  injectReducedMotionCSS();
}

// React import for hook
import React from "react";
