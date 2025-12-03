/**
 * ESLint Plugin: layered-ui
 *
 * Enforces theme token usage and prevents hard-coded values in components.
 * Ensures all components respect the three-level adaptive theming system.
 */

// Rule 1: no-hardcoded-colors
export const noHardcodedColors = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow hard-coded color values in className or style props",
      category: "Theming",
      recommended: true,
    },
    messages: {
      hardcodedColor:
        "Hard-coded color '{{value}}' detected. Use semantic Tailwind classes (bg-background, text-foreground, etc.) instead.",
      staticColorClass:
        "Static color class '{{value}}' detected. Use semantic classes (bg-primary, text-muted, etc.) instead.",
    },
    schema: [],
  },
  create(context: any) {
    // Forbidden color patterns
    const forbiddenColorPatterns = [
      // Tailwind static colors
      /bg-(red|blue|green|yellow|purple|pink|indigo|gray|slate|zinc|neutral|stone|orange|amber|lime|emerald|teal|cyan|sky|violet|fuchsia|rose)-\d+/,
      // Text colors
      /text-(red|blue|green|yellow|purple|pink|indigo|gray|slate|zinc|neutral|stone|orange|amber|lime|emerald|teal|cyan|sky|violet|fuchsia|rose)-\d+/,
      // Border colors
      /border-(red|blue|green|yellow|purple|pink|indigo|gray|slate|zinc|neutral|stone|orange|amber|lime|emerald|teal|cyan|sky|violet|fuchsia|rose)-\d+/,
      // Hex colors in style
      /#[0-9A-Fa-f]{3,6}/,
      // RGB/RGBA colors
      /rgba?\([^)]+\)/,
      // HSL/HSLA colors
      /hsla?\([^)]+\)/,
    ];

    // Allowed semantic classes
    const allowedSemanticClasses = [
      "bg-background",
      "bg-foreground",
      "bg-card",
      "bg-card-foreground",
      "bg-popover",
      "bg-popover-foreground",
      "bg-primary",
      "bg-primary-foreground",
      "bg-secondary",
      "bg-secondary-foreground",
      "bg-muted",
      "bg-muted-foreground",
      "bg-accent",
      "bg-accent-foreground",
      "bg-destructive",
      "bg-destructive-foreground",
      "text-background",
      "text-foreground",
      "text-card",
      "text-card-foreground",
      "text-popover",
      "text-popover-foreground",
      "text-primary",
      "text-primary-foreground",
      "text-secondary",
      "text-secondary-foreground",
      "text-muted",
      "text-muted-foreground",
      "text-accent",
      "text-accent-foreground",
      "text-destructive",
      "text-destructive-foreground",
      "border-border",
      "border-input",
      "ring-ring",
      "bg-chart-1",
      "bg-chart-2",
      "bg-chart-3",
      "bg-chart-4",
      "bg-chart-5",
    ];

    function checkClassName(node: any, value: string) {
      const classes = value.split(/\s+/);

      for (const cls of classes) {
        // Skip if it's an allowed semantic class
        if (allowedSemanticClasses.some((allowed) => cls.includes(allowed))) {
          continue;
        }

        // Check against forbidden patterns
        for (const pattern of forbiddenColorPatterns) {
          if (pattern.test(cls)) {
            context.report({
              node,
              messageId: "staticColorClass",
              data: { value: cls },
            });
            break;
          }
        }
      }
    }

    function checkStyleProp(node: any, properties: any[]) {
      for (const prop of properties) {
        if (prop.type !== "Property") continue;

        const key = prop.key.name || prop.key.value;
        if (
          ![
            "color",
            "backgroundColor",
            "borderColor",
            "fill",
            "stroke",
          ].includes(key)
        ) {
          continue;
        }

        const value = prop.value;
        let valueStr = "";

        if (value.type === "Literal") {
          valueStr = String(value.value);
        } else if (value.type === "TemplateLiteral") {
          valueStr = value.quasis.map((q: any) => q.value.raw).join("");
        }

        // Check for hard-coded colors
        for (const pattern of forbiddenColorPatterns) {
          if (pattern.test(valueStr)) {
            context.report({
              node: prop,
              messageId: "hardcodedColor",
              data: { value: valueStr },
            });
            break;
          }
        }
      }
    }

    return {
      JSXAttribute(node: any) {
        if (node.name.name === "className" && node.value) {
          if (node.value.type === "Literal") {
            checkClassName(node, node.value.value);
          } else if (node.value.type === "JSXExpressionContainer") {
            const expr = node.value.expression;
            if (expr.type === "Literal") {
              checkClassName(node, expr.value);
            } else if (expr.type === "TemplateLiteral") {
              const str = expr.quasis.map((q: any) => q.value.raw).join("");
              checkClassName(node, str);
            }
          }
        }

        if (node.name.name === "style" && node.value) {
          if (node.value.type === "JSXExpressionContainer") {
            const expr = node.value.expression;
            if (expr.type === "ObjectExpression") {
              checkStyleProp(node, expr.properties);
            }
          }
        }
      },
    };
  },
};

// Rule 2: no-hardcoded-spacing
export const noHardcodedSpacing = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow hard-coded spacing values in className or style props",
      category: "Theming",
      recommended: true,
    },
    messages: {
      hardcodedSpacing:
        "Hard-coded spacing '{{value}}' detected. Use theme tokens (tokens.spacing.*) instead.",
      staticSpacingClass:
        "Static spacing class '{{value}}' detected. Use responsive spacing or theme tokens instead.",
    },
    schema: [],
  },
  create(context: any) {
    // Forbidden spacing patterns (fixed Tailwind spacing)
    const forbiddenSpacingPatterns = [
      /^(p|m|px|py|pt|pb|pl|pr|mx|my|mt|mb|ml|mr)-\d+$/,
      /^gap-\d+$/,
      /^space-(x|y)-\d+$/,
    ];

    // Allowed responsive patterns
    const allowedPatterns = [
      /^(p|m|px|py|pt|pb|pl|pr|mx|my|mt|mb|ml|mr)-(sm|md|lg|xl|2xl):/,
      /^gap-(sm|md|lg|xl|2xl):/,
    ];

    function checkClassName(node: any, value: string) {
      const classes = value.split(/\s+/);

      for (const cls of classes) {
        // Skip if it's a responsive class
        if (allowedPatterns.some((pattern) => pattern.test(cls))) {
          continue;
        }

        // Check against forbidden patterns
        for (const pattern of forbiddenSpacingPatterns) {
          if (pattern.test(cls)) {
            context.report({
              node,
              messageId: "staticSpacingClass",
              data: { value: cls },
            });
            break;
          }
        }
      }
    }

    function checkStyleProp(node: any, properties: any[]) {
      const spacingProps = [
        "padding",
        "paddingTop",
        "paddingBottom",
        "paddingLeft",
        "paddingRight",
        "margin",
        "marginTop",
        "marginBottom",
        "marginLeft",
        "marginRight",
        "gap",
        "rowGap",
        "columnGap",
      ];

      for (const prop of properties) {
        if (prop.type !== "Property") continue;

        const key = prop.key.name || prop.key.value;
        if (!spacingProps.includes(key)) continue;

        const value = prop.value;
        let valueStr = "";

        if (value.type === "Literal") {
          valueStr = String(value.value);
        }

        // Check for hard-coded pixel values
        if (/^\d+px$/.test(valueStr)) {
          context.report({
            node: prop,
            messageId: "hardcodedSpacing",
            data: { value: valueStr },
          });
        }
      }
    }

    return {
      JSXAttribute(node: any) {
        if (node.name.name === "className" && node.value) {
          if (node.value.type === "Literal") {
            checkClassName(node, node.value.value);
          } else if (node.value.type === "JSXExpressionContainer") {
            const expr = node.value.expression;
            if (expr.type === "Literal") {
              checkClassName(node, expr.value);
            } else if (expr.type === "TemplateLiteral") {
              const str = expr.quasis.map((q: any) => q.value.raw).join("");
              checkClassName(node, str);
            }
          }
        }

        if (node.name.name === "style" && node.value) {
          if (node.value.type === "JSXExpressionContainer") {
            const expr = node.value.expression;
            if (expr.type === "ObjectExpression") {
              checkStyleProp(node, expr.properties);
            }
          }
        }
      },
    };
  },
};

// Rule 3: require-theme-tokens
export const requireThemeTokens = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require useInterfaceLevel and getThemeTokens in components with adaptive styling",
      category: "Theming",
      recommended: true,
    },
    messages: {
      missingThemeImport:
        "Component uses adaptive styling but doesn't import theme utilities. Add: import { useInterfaceLevel } from '@/polymet/components/theme-provider'",
      missingTokensUsage:
        "Component should use getThemeTokens(level) to access theme tokens for adaptive styling.",
    },
    schema: [],
  },
  create(context: any) {
    let hasThemeImport = false;
    let hasTokensUsage = false;
    let hasAdaptiveStyling = false;

    return {
      ImportDeclaration(node: any) {
        if (node.source.value === "@/polymet/components/theme-provider") {
          const specifiers = node.specifiers;
          if (
            specifiers.some(
              (s: any) => s.imported?.name === "useInterfaceLevel"
            )
          ) {
            hasThemeImport = true;
          }
        }
        if (node.source.value === "@/polymet/data/theme-tokens") {
          const specifiers = node.specifiers;
          if (
            specifiers.some((s: any) => s.imported?.name === "getThemeTokens")
          ) {
            hasTokensUsage = true;
          }
        }
      },
      CallExpression(node: any) {
        if (node.callee.name === "getThemeTokens") {
          hasTokensUsage = true;
        }
      },
      JSXAttribute(node: any) {
        // Check if component has style prop with dynamic values
        if (
          node.name.name === "style" &&
          node.value?.type === "JSXExpressionContainer"
        ) {
          hasAdaptiveStyling = true;
        }
      },
      "Program:exit"(node: any) {
        if (hasAdaptiveStyling && !hasThemeImport) {
          context.report({
            node,
            messageId: "missingThemeImport",
          });
        }
        if (hasAdaptiveStyling && hasThemeImport && !hasTokensUsage) {
          context.report({
            node,
            messageId: "missingTokensUsage",
          });
        }
      },
    };
  },
};

// Rule 4: no-hardcoded-font-sizes
export const noHardcodedFontSizes = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow hard-coded font sizes in className or style props",
      category: "Theming",
      recommended: true,
    },
    messages: {
      hardcodedFontSize:
        "Hard-coded font size '{{value}}' detected. Use tokens.typography.* instead.",
      staticTextClass:
        "Static text size class '{{value}}' detected. Use theme tokens for adaptive typography.",
    },
    schema: [],
  },
  create(context: any) {
    const forbiddenTextPatterns = [
      /^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/,
    ];

    function checkClassName(node: any, value: string) {
      const classes = value.split(/\s+/);

      for (const cls of classes) {
        for (const pattern of forbiddenTextPatterns) {
          if (pattern.test(cls)) {
            context.report({
              node,
              messageId: "staticTextClass",
              data: { value: cls },
            });
            break;
          }
        }
      }
    }

    function checkStyleProp(node: any, properties: any[]) {
      for (const prop of properties) {
        if (prop.type !== "Property") continue;

        const key = prop.key.name || prop.key.value;
        if (key !== "fontSize") continue;

        const value = prop.value;
        let valueStr = "";

        if (value.type === "Literal") {
          valueStr = String(value.value);
        }

        // Check for hard-coded pixel values
        if (/^\d+px$/.test(valueStr)) {
          context.report({
            node: prop,
            messageId: "hardcodedFontSize",
            data: { value: valueStr },
          });
        }
      }
    }

    return {
      JSXAttribute(node: any) {
        if (node.name.name === "className" && node.value) {
          if (node.value.type === "Literal") {
            checkClassName(node, node.value.value);
          } else if (node.value.type === "JSXExpressionContainer") {
            const expr = node.value.expression;
            if (expr.type === "Literal") {
              checkClassName(node, expr.value);
            } else if (expr.type === "TemplateLiteral") {
              const str = expr.quasis.map((q: any) => q.value.raw).join("");
              checkClassName(node, str);
            }
          }
        }

        if (node.name.name === "style" && node.value) {
          if (node.value.type === "JSXExpressionContainer") {
            const expr = node.value.expression;
            if (expr.type === "ObjectExpression") {
              checkStyleProp(node, expr.properties);
            }
          }
        }
      },
    };
  },
};

// Plugin export
export const eslintPluginLayeredUI = {
  rules: {
    "no-hardcoded-colors": noHardcodedColors,
    "no-hardcoded-spacing": noHardcodedSpacing,
    "require-theme-tokens": requireThemeTokens,
    "no-hardcoded-font-sizes": noHardcodedFontSizes,
  },
  configs: {
    recommended: {
      plugins: ["layered-ui"],
      rules: {
        "layered-ui/no-hardcoded-colors": "error",
        "layered-ui/no-hardcoded-spacing": "error",
        "layered-ui/require-theme-tokens": "warn",
        "layered-ui/no-hardcoded-font-sizes": "error",
      },
    },
    strict: {
      plugins: ["layered-ui"],
      rules: {
        "layered-ui/no-hardcoded-colors": "error",
        "layered-ui/no-hardcoded-spacing": "error",
        "layered-ui/require-theme-tokens": "error",
        "layered-ui/no-hardcoded-font-sizes": "error",
      },
    },
  },
};

// ESLint configuration example
export const eslintConfigExample = `
// .eslintrc.js
module.exports = {
  extends: [
    "next/core-web-vitals",
    "plugin:layered-ui/recommended"
  ],
  plugins: ["layered-ui"],
  rules: {
    // Enforce theme token usage
    "layered-ui/no-hardcoded-colors": "error",
    "layered-ui/no-hardcoded-spacing": "error",
    "layered-ui/require-theme-tokens": "warn",
    "layered-ui/no-hardcoded-font-sizes": "error",
  },
};
`;

// Usage examples
export const usageExamples = {
  // ❌ FAILS LINT
  badExamples: `
// ❌ Hard-coded color
<div className="bg-blue-500 text-white">Content</div>

// ❌ Hard-coded spacing
<div className="p-4 m-2">Content</div>

// ❌ Hard-coded font size
<h1 className="text-2xl">Title</h1>

// ❌ Hard-coded style values
<div style={{ padding: "16px", color: "#3b82f6" }}>Content</div>
`,

  // ✅ PASSES LINT
  goodExamples: `
// ✅ Semantic colors
<div className="bg-primary text-primary-foreground">Content</div>

// ✅ Theme tokens for spacing
const tokens = getThemeTokens(level);
<div style={{ padding: \`\${tokens.spacing.card}px\` }}>Content</div>

// ✅ Theme tokens for typography
<h1 style={{ fontSize: \`\${tokens.typography.heading}px\` }}>Title</h1>

// ✅ Semantic classes with proper imports
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
      Content
    </div>
  );
}
`,
};

export default eslintPluginLayeredUI;
