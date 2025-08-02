import js from "@eslint/js";
import mm from "@maxmilton/eslint-config";
import unicorn from "eslint-plugin-unicorn";
import ts from "typescript-eslint";

const OFF = 0;
const ERROR = 2;

export default ts.config(
  js.configs.recommended,
  ts.configs.strictTypeChecked,
  ts.configs.stylisticTypeChecked,
  unicorn.configs.recommended,
  mm.configs.recommended,
  {
    linterOptions: {
      reportUnusedDisableDirectives: ERROR,
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      quotes: [ERROR, "double", { avoidEscape: true }],

      // clearer code when used mindfully
      "no-plusplus": OFF,
      "unicorn/switch-case-braces": OFF,

      // prefer to clearly separate Bun and DOM
      "unicorn/prefer-global-this": OFF,

      // better performance
      "unicorn/prefer-dom-node-append": OFF,
    },
  },
  { ignores: ["**/*.bak", "coverage", "dist"] },
);
