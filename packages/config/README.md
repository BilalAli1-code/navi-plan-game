# @projectsim/config

Shared build, lint, and formatting configuration for the ProjectSim 2.0 monorepo.

## Exports

| Entry                                   | Purpose                                                                                                                 |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `@projectsim/config/tsconfig.base.json` | Strict TypeScript compiler options (see `docs/handbook/03_TypeScript_Standards.md`). Extended by every package and app. |
| `@projectsim/config/eslint`             | Shared ESLint flat-config preset.                                                                                       |
| `@projectsim/config/prettier`           | Shared Prettier configuration.                                                                                          |

## Usage

`tsconfig.json`:

```json
{ "extends": "@projectsim/config/tsconfig.base.json" }
```

`eslint.config.mjs`:

```js
export { default } from "@projectsim/config/eslint";
```

This package contains configuration only — no runtime/business logic.
