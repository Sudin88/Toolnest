import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL("./", import.meta.url));

export default defineConfig({
  resolve: {
    // Mirrors the `@/*` path in tsconfig.json so tests import the same modules
    // the app does. Anchored to `@/` so scoped packages are left alone.
    alias: [{ find: /^@\//, replacement: root }],
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
