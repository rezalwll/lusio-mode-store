/**
 * ESLint-only TypeScript runtime shim (no runtime/app effect).
 *
 * Why this file exists:
 * The project compiles with TypeScript 7.0.2, but the latest stable
 * typescript-eslint (8.70.0) hard-refuses to run on TypeScript >= 7
 * ("typescript-eslint does not support TS 7.0", tracked upstream for TS >= 7.1
 * support). Downgrading the project's compiler is out of scope, and no stable
 * typescript-eslint supports TS 7, so the lint tooling parses with the stable
 * TypeScript 6.0.3 runtime installed under the `typescript-v6` alias.
 *
 * How it works:
 * `eslint.config.js` imports this module for its side effect BEFORE importing
 * `typescript-eslint`. The patch reroutes `require("typescript")` calls made
 * from inside `@typescript-eslint/*` and `ts-api-utils` to the `typescript-v6`
 * package. Everything else (tsc, vite, the app) keeps using TypeScript 7.0.2.
 * Only non-type-aware rules are enabled, so the parser never needs the
 * project's actual compiler semantics.
 *
 * Removal criteria:
 * Delete this file, the `typescript-v6` devDependency, and the side-effect
 * import in `eslint.config.js` once a stable typescript-eslint supports the
 * project's TypeScript version.
 */
import Module from "node:module";

const originalResolveFilename = Module._resolveFilename;

const REDIRECTED_PARENTS = ["typescript-eslint", "ts-api-utils"];

Module._resolveFilename = function (request, parent, ...rest) {
  const parentPath = parent && parent.filename ? parent.filename : "";
  if (
    typeof request === "string" &&
    REDIRECTED_PARENTS.some((marker) => parentPath.includes(marker))
  ) {
    if (request === "typescript") {
      request = "typescript-v6";
    } else if (request.startsWith("typescript/")) {
      request = "typescript-v6" + request.slice("typescript".length);
    }
  }
  return originalResolveFilename.call(this, request, parent, ...rest);
};
