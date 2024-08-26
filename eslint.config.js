import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import pluginHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  {files: ["src/**/*.{js,mjs,cjs,ts,jsx,tsx}"]},
  {ignores: ['resources/**/*']},
  {settings: {
      react: {
        version: "detect"
      }
  }},
  {languageOptions: { globals: globals.browser }},
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  pluginReact.configs.flat["jsx-runtime"],
  {
    plugins: { "react-hooks": pluginHooks },
    rules: pluginHooks.configs.recommended.rules,
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { args: "none" }]
    }
  },
);
