import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";

export default [
  { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },
  { languageOptions: { globals: globals.node } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off", // Disable warnings for `any` type
      "no-unused-vars": "off", // Disable no-unused-vars rule from ESLint core
      "@typescript-eslint/no-unused-vars": ["off"], // Disable no-unused-vars rule for TypeScript
      "unused-imports/no-unused-imports": "off", // Disable unused imports rule if using `eslint-plugin-unused-imports`
    },
  },
];
