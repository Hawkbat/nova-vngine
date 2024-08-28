import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import pluginHooks from "eslint-plugin-react-hooks";
import pluginImportX from "eslint-plugin-import-x";

export default tseslint.config(
  {files: ["src/**/*.{js,mjs,cjs,ts,jsx,tsx}"]},
  {ignores: ["eslint.config.js", "resources/**/*"]},
  {settings: {
      react: {
        version: "detect"
      }
  }},
  {languageOptions: { globals: globals.browser }},
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { "import-x": pluginImportX },
    rules: { ...pluginImportX.configs.recommended.rules },
  },
  pluginImportX.configs.typescript,
  pluginReact.configs.flat.recommended,
  pluginReact.configs.flat["jsx-runtime"],
  {
    plugins: { "react-hooks": pluginHooks },
    rules: pluginHooks.configs.recommended.rules,
  },
  {
    rules: {
      "@typescript-eslint/consistent-type-imports": ["error"],
      "import-x/no-cycle": ["error", { maxDepth: 5 }],
      "@typescript-eslint/no-unused-vars": ["warn", { args: "none", varsIgnorePattern: "^_|^styles$" }],
      "import-x/no-unused-modules": ["warn"],
    }
  },
);
