# Numerology CMS Monorepo

This repository contains a full-stack monorepo managed with `pnpm`. It was originally built on Replit and includes multiple applications inside the `artifacts/` folder.

## Project Structure

- `artifacts/numerology-cms/`: The main frontend application built with Vite and React.
- `artifacts/mockup-sandbox/`: A sandbox environment for UI mockups.
- `artifacts/api-server/`: The backend API service (if applicable).
- `packages/` or `lib/`: Shared workspace packages used across the applications.

## Local Development

This project uses `pnpm` as its package manager. Ensure you have Node.js and `pnpm` installed.

### 1. Install Dependencies
Run the following command at the root of the repository to install dependencies for all workspace projects:

```bash
pnpm install
```

### 2. Start the Development Server
To start the development server for a specific app (e.g., `numerology-cms`), you can navigate to its directory:

```bash
cd artifacts/numerology-cms
pnpm run dev
```

Alternatively, you can rely on any root-level scripts defined in `package.json` to manage all apps simultaneously.

## Deployment to Vercel

To deploy this project to Vercel via GitHub, follow these configuration steps to ensure the monorepo builds correctly:

1. **Import Project**: In your Vercel Dashboard, click **Add New... > Project** and import this repository.
2. **Framework Preset**: Ensure Vercel detects **Vite** (or set it manually).
3. **Root Directory**: Click "Edit" and set the root directory to the specific application you want to deploy, for example: `artifacts/numerology-cms`.
4. **Build & Install Commands**: Leave both the Build Command and Install Command as their defaults. Vercel automatically detects the `pnpm-workspace.yaml` at the root, installs all dependencies at the root level, and then runs the build script inside your specified root directory.
5. **Environment Variables**: Add any necessary environment variables for your application in the Vercel dashboard.

**Note:** The root `package.json` has been configured with `pnpm.onlyBuiltDependencies` to allow `esbuild` during Vercel's installation process, which prevents `[ERR_PNPM_IGNORED_BUILDS]` errors common in newer `pnpm` versions.
