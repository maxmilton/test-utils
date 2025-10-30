import js from "@eslint/js";
import mm from "@maxmilton/eslint-config";
import { defineConfig } from "eslint/config";
import unicorn from "eslint-plugin-unicorn";
import ts from "typescript-eslint";

export default defineConfig(
  js.configs.recommended,
  ts.configs.strictTypeChecked,
  ts.configs.stylisticTypeChecked,
  // @ts-expect-error - broken upstream types
  unicorn.configs.recommended,
  mm.configs.recommended,
  {
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "no-plusplus": "off", // clearer code when used mindfully
      "unicorn/prefer-dom-node-append": "off", // better performance
      "unicorn/prefer-global-this": "off", // prefer to clearly separate Bun and DOM
      "unicorn/switch-case-braces": "off",
    },
  },
  { ignores: ["**/*.bak", "coverage", "dist"] },
);
