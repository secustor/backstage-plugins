# Contributing to the Project

Thank you for considering contributing to our project! Here are some guidelines to help you get started.

## Prerequisites

Before you begin your dev work, ensure you have met the following requirements:

- Node.js 22.13.0 or higher is installed on your machine
- Yarn 4.0.0 or higher is installed on your machine

### Recommended: Install Node.js and Yarn via Mise

The recommended way to manage the Node.js version is to use [Mise](https://mise.jdx.dev). Mise is a polyglot tool version manager that allows you to define tool versions on a per-project basis.

Node.js version is defined in [`mise.toml`](https://github.com/secustor/backstage-plugins/blob/main/mise.toml). Yarn is managed via Corepack using the `packageManager` field in `package.json`.

### Alternative: Use Corepack

Corepack is a tool that manages package managers like Yarn and PNPM as if they were Node.js modules. This allows you to install Yarn as based on the `package.json` `packageManager` field.  
It's been included in Node.js since 16.

1. Ensure that Node.js 22 is installed on your machine.
1. Enable Corepack:
   ```sh
   corepack enable
   ```
1. Check that yarn v4 is installed:
   ```sh
   yarn --version
   ```

## Validating Changes

Before submitting a pull request, ensure that your changes pass the following checks:

- The code is formatted using Prettier
- The code passes the ESLint checks
- The code passes the Jest tests
- The code passes the TypeScript checks

To run these checks, use the following commands:

```sh
yarn check
```

To fix automatically fixable issues, use the following command:

```sh
yarn fix
```
