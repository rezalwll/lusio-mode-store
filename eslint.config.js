import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      ".next/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      // Legacy static output + its assets: not part of the React app.
      "*.html",
      "assets/**",
      // Legacy static-site generator (outputs the ignored root *.html pages).
      "scripts/**",
      "docs/**",
    ],
  },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  reactRefresh.configs.next,
  {
    files: ["src/**/*"],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ["*.config.*"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  {
    // Narrow Fast Refresh handling (no module rewrites):
    // src/components/ui/button.tsx pairs the Button component with the
    // widely-imported `buttonVariants` (cva) object; `allowExportNames` is
    // the plugin's intended narrow option for that pattern. Next framework
    // exports (metadata, viewport, route-segment options) are already
    // allowed by the plugin's Next preset above, so no extra override.
    files: ["src/components/ui/button.tsx"],
    rules: {
      "react-refresh/only-export-components": [
        "error",
        {
          allowConstantExport: true,
          allowCompoundComponents: true,
          allowExportNames: ["buttonVariants"],
        },
      ],
    },
  },
  {
    // React Compiler rules stay at `warn`: this project does not use React
    // Compiler (no compiler plugin in dependencies or build), so these v7
    // rules can flag correct, idiomatic code (react-hook-form `watch()`,
    // `Date.now()` in `useMemo`, manual `useMemo` for derived admin data).
    // They remain visible as warnings for later review rather than being
    // turned off. Core hooks rules (`rules-of-hooks`, `exhaustive-deps`)
    // remain fully enabled.
    rules: {
      "react-hooks/incompatible-library": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/purity": "warn",
    },
  },
);
