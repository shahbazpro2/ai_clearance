# Red Crane Media - Frontend Portal

A Next.js frontend application for the Advertiser / Admin and Insert Distributor platform.

## Overview

This repository contains the frontend UI built with:
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Radix UI components
- Jotai for state management

The app includes login, signup, campaign management, retailer onboarding, admin dashboards, and payments flow.

## Installation

### Prerequisites

- Node.js 20+ installed
- npm 10+ installed
- Git installed

### Setup

1. Open a terminal in the repo root:
   ```bash
   cd RedCrane-FrontEnd
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create or update environment variables.
   - If the project uses a `.env` file, add your API host, auth keys, and any other required values.
   - Example environment file name:
     - `.env.local`

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open the app in your browser:
   ```text
   http://localhost:3020
   ```

## Available Scripts

- `npm run dev` — start the local development server on port `3020`
- `npm run build` — build the production app
- `npm run start` — run the built app in production mode
- `npm run lint` — run ESLint

## Docker

Build the production image:

```bash
docker build -t ai-clearance .
docker run --rm -p 3020:3000 ai-clearance
```

Open http://localhost:3020. The Dockerfile defaults to `http://34.9.36.203:8080`,
copied from the project's `.env`. Override it with
`--build-arg NEXT_PUBLIC_API_URL=https://your-api.com` when building if needed.
`NEXT_PUBLIC_API_URL` is embedded at build time; rebuild the image to change it.
Local `.env` files are excluded from the image. If you add server-only runtime
variables, pass them with `docker run --env-file .env` before the image name.
The build needs internet access to install npm packages and download Google fonts.

## Project Structure

Key directories:

- `src/app/` — Next.js application routes and pages
- `src/components/` — reusable UI components and layout wrappers
- `src/hooks/` — custom React hooks
- `src/lib/` — shared utilities, API helpers, and route definitions
- `src/store/` — application state stores
- `public/` — static assets

## Notes

- This repo is configured for a Next.js 16 app with Tailwind CSS 4 support.
- The frontend expects backend APIs under `src/api/` routes and custom auth/campaign endpoints defined in `src/api` and `api/`.

## Troubleshooting

- If `npm install` fails, verify your Node.js and npm versions.
- If the app does not start, make sure port `3020` is available or update the port in `package.json` and `next.config.ts` if needed.
- If environment variables are required, confirm they are set in `.env.local` or your deployment environment.

## License

This repository is currently private. Update this section if you choose to open source it.
