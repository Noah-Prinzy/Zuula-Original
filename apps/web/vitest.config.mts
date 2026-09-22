import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

// Unit and component tests (spec §7.4). Run `npm test`, or `npm run test:coverage` for the
// coverage report (HTML in coverage/). Tests live next to the code as *.test.ts(x).
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    // Pure logic runs in Node (fast); files that need a DOM opt in with a
    // `// @vitest-environment jsdom` comment on their first line.
    environment: "node",
    setupFiles: ["./test/setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**"],
    css: false,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      include: ["lib/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "i18n/**/*.ts"],
      exclude: [
        "**/*.test.{ts,tsx}",
        // Generated shadcn primitives and sample data are not ours to test.
        "components/ui/**",
        "lib/mock/**",
        "lib/types/**",
      ],
      reporter: ["text-summary", "text", "html"],
      // §7.4 targets 80%. Enforced per area as each gets tests; widen as coverage grows.
      thresholds: {
        "lib/**": { statements: 80, branches: 75, functions: 80, lines: 80 },
        "i18n/**": { statements: 80, branches: 75, functions: 80, lines: 80 },
        "components/motion/text/**": { statements: 80, branches: 75, functions: 80, lines: 80 },
        "components/verdict/**": { statements: 80, branches: 75, functions: 80, lines: 80 },
        "components/community/**": { statements: 80, branches: 75, functions: 80, lines: 80 },
        "components/submission/**": { statements: 80, branches: 70, functions: 75, lines: 80 },
      },
    },
  },
})
