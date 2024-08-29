import globals from "globals";
import pluginEslint from "@eslint/js";
import pluginTseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import pluginHooks from "eslint-plugin-react-hooks";
import pluginImportX from "eslint-plugin-import-x";
import pluginStylistic from "@stylistic/eslint-plugin";

export default pluginTseslint.config(
  {files: ["src/**/*.{js,mjs,cjs,ts,jsx,tsx}"]},
  {ignores: ["eslint.config.js", "scripts/**/*", "resources/**/*"]},
  {settings: {
      react: {
        version: "detect"
      }
  }},
  {languageOptions: { globals: globals.browser, parserOptions: { projectService: true, tsconfigRootDir: 'src' } }},
  pluginEslint.configs.recommended,
  ...pluginTseslint.configs.strictTypeChecked,
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
    plugins: {
      "@stylistic": pluginStylistic,
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-import-type-side-effects": "error",
      "@typescript-eslint/promise-function-async": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "import-x/no-cycle": ["error", { maxDepth: 5 }],
      "no-template-curly-in-string": "error",

      "@typescript-eslint/no-unused-vars": ["warn", { args: "none", varsIgnorePattern: "^_|^styles$" }],
      "import-x/no-unused-modules": "warn",

      "@stylistic/no-tabs": "warn",
      "@stylistic/no-trailing-spaces": "warn",
      "@stylistic/quotes": ["warn", "single"],
      "@stylistic/semi": ["warn", "never"],
      "@stylistic/member-delimiter-style": ["warn", { multiline: { delimiter: "none", requireLast: false }, singleline: { delimiter: "comma", requireLast: false } }],
      "@stylistic/jsx-quotes": ["warn", "prefer-single"],
      "@stylistic/jsx-props-no-multi-spaces": "warn",

      "@typescript-eslint/no-confusing-void-expression": "off"
    }
  },
);
