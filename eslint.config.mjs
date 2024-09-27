import globals from "globals";
import { FlatCompat } from "@eslint/eslintrc";
import tseslint from "@typescript-eslint/eslint-plugin";
import * as tseslintParser from "@typescript-eslint/parser";
import spellcheck from "eslint-plugin-spellcheck";

// Use FlatCompat to load configurations that are not flat-compatible yet
const compat = new FlatCompat();

export default [
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    languageOptions: {
      parser: tseslintParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
      },
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      spellcheck: spellcheck,
    },
    rules: {
      // General rules
      "no-console": "warn",
      "no-debugger": "warn",
      "no-unused-vars": "off", // Turn off base rule
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "off",
      semi: ["warn", "always"],
      quotes: ["warn", "double"],
      "comma-dangle": ["warn", "only-multiline"],
      indent: ["warn", 2],
    },
  },
  ...compat.extends("plugin:@typescript-eslint/recommended"),
  ...compat.extends("plugin:react/recommended"),
];
