import globals from "globals";
import { FlatCompat } from "@eslint/eslintrc";
import tsParser from "@typescript-eslint/parser";
import spellcheck from "eslint-plugin-spellcheck";

// Use FlatCompat to load configurations that are not flat-compatible yet
const compat = new FlatCompat();

export default [
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    languageOptions: {
      parser: tsParser, // Use TypeScript parser
      globals: globals.node,
    },
    rules: {
      "no-console": "warn", // Allow console logs
      "no-debugger": "warn",
      "no-unused-vars": "warn", // Turn off warnings for unused variables
      "@typescript-eslint/no-unused-vars": "warn", // Turn off warnings for unused variables (TypeScript)
      "@typescript-eslint/no-explicit-any": "off", // Allow 'any' type
      semi: ["warn", "always"],
      quotes: ["warn", "double"],
      "comma-dangle": ["warn", "only-multiline"],
      indent: ["warn", 2],
      "spellcheck/spell-checker": "warn",
    },
    plugins: {
      spellcheck: spellcheck, // Add the spellcheck plugin
    }, // Add this line to include the spellcheck plugin
  },
  // Use FlatCompat to handle TypeScript and React recommended configurations
  ...compat.extends("plugin:@typescript-eslint/recommended"),
  ...compat.extends("plugin:react/recommended"),
];
