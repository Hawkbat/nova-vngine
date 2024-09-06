import globals from "globals";
import pluginEslint from "@eslint/js";
import pluginTseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import pluginHooks from "eslint-plugin-react-hooks";
import pluginImportX from "eslint-plugin-import-x";
import pluginStylistic from "@stylistic/eslint-plugin";
import pluginSimpleImportSort from "eslint-plugin-simple-import-sort";

export default pluginTseslint.config(
  {files: ["src/**/*.{js,mjs,cjs,ts,jsx,tsx}"]},
  {ignores: ["eslint.config.js", "scripts/**/*", "resources/**/*", "dist/**/*"]},
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
      "simple-import-sort": pluginSimpleImportSort,
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
      "no-warning-comments": ["warn", { terms: ['todo'], location: 'start', decoration: ['*'] }],

      "simple-import-sort/imports": ["warn", { groups: [
        // Side effect imports.
        ["^\\u0000"],
        // Node.js builtins prefixed with `node:`.
        ["^node:"],
        // Packages.
        // Things that start with a letter (or digit or underscore), or `@` followed by a letter.
        ["^@?\\w"],
        // Absolute imports and other imports such as Vue-style `@/foo`.
        // Anything not matched in another group.
        ["^"],
        // Relative imports.
        // Anything that starts with a dot.
        ["^\\."],
        // Style imports.
        ["^.*?\.module\.css"],
      ] }],
      "@stylistic/no-tabs": "warn",
      "@stylistic/no-trailing-spaces": "warn",
      "@stylistic/quotes": ["warn", "single"],
      "@stylistic/semi": ["warn", "never"],
      "@stylistic/member-delimiter-style": ["warn", { multiline: { delimiter: "none", requireLast: false }, singleline: { delimiter: "comma", requireLast: false } }],
      "@stylistic/jsx-quotes": ["warn", "prefer-single"],
      "@stylistic/jsx-props-no-multi-spaces": "warn",
      "@stylistic/object-curly-spacing": ["warn", "always"],
      "@stylistic/comma-spacing": "warn",
      "@stylistic/comma-style": "warn",
      "@stylistic/comma-dangle": ["warn", "always-multiline"],

      "require-await": "off",
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-confusing-void-expression": "off",
      "react/prop-types": "off",
    }
  },
);
