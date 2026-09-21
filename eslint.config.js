// Side-effect import first: reroutes typescript-eslint's internal
// `require("typescript")` to the TS 6 runtime (see tools/eslint-typescript-shim.mjs).
// The project itself keeps compiling with TypeScript 7.0.2.
import "./tools/eslint-typescript-shim.mjs";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
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
  reactRefresh.configs.vite,
  {
    files: ["src/**/*"],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ["*.config.*", "tools/**/*", "vite.config.*"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  {
    // Narrow Fast Refresh handling (no module rewrites):
    // - src/app/router.tsx is a TanStack Router route-tree module: one stable
    //   `router` export plus file-local view components (route cohesion is the
    //   framework idiom). The rule can only be satisfied by splitting this
    //   canonical file apart, so it stays off here — Vite HMR still reloads it.
    // - src/components/ui/button.tsx pairs the Button component with the
    //   widely-imported `buttonVariants` (cva) object; `allowExportNames` is
    //   the plugin's intended narrow option for that pattern.
    files: ["src/app/router.tsx"],
    rules: { "react-refresh/only-export-components": "off" },
  },
  {
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
    // React Compiler rules stay off: this project does not use React Compiler
    // (no compiler plugin in dependencies or build), so these v7 rules encode
    // assumptions that do not hold here and flag correct, idiomatic code
    // (react-hook-form `watch()`, `Date.now()` in `useMemo`, manual `useMemo`
    // for derived admin data). Core hooks rules (`rules-of-hooks`,
    // `exhaustive-deps`) remain fully enabled.
    rules: {
      "react-hooks/incompatible-library": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/purity": "off",
    },
  },
);
