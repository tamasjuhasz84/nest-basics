import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**"],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
  ...tseslint.configs.recommended,
  {
    files: [
      "src/**/*.ts",
      "test/**/*.ts",
      "scripts/**/*.ts",
      "migrations/**/*.ts",
    ],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
        ...globals.es2021,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]);
