# FreshMart Production Deployment Guide

## Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

## Monorepo Workspaces Setup

Install all workspace dependencies across Frontend, Admin, and Backend:

```bash
npm install
```

## Development Mode

Run services independently or together:

```bash
# Run Backend API (Port 5001)
npm run dev:backend

# Run Customer Frontend (Port 5173)
npm run dev:frontend

# Run Admin Portal (Port 5174)
npm run dev:admin
```

## Production Build

```bash
# Build customer storefront
npm run build --workspace=frontend

# Build admin portal
npm run build --workspace=admin
```

## Process Management (PM2)

Start backend API in production cluster mode:

```bash
pm2 start backend/src/server.js --name freshmart-api -i max
```

## Environment Variables

Ensure the following are set in `backend/.env`:
- `PORT=5001`
- `JWT_SECRET=your_super_secret_jwt_key`
- `NODE_ENV=production`

## Deploying to Vercel

FreshMart comes pre-configured for one-click deployment on [Vercel](https://vercel.com):

### Option 1: Root Deployment (Full Storefront + Serverless API)
- Connect repository `https://github.com/piy-jpg/FreshMart` to Vercel.
- Framework Preset: **Other**.
- Root Directory: `./` (leave default).
- The included `vercel.json` and `api/index.js` automatically routes static pages, clean URLs, and serverless API handlers.

### Option 2: Frontend SPA Deployment
- If deploying only the React Vite customer storefront:
  - Root Directory: `frontend`
  - Framework Preset: **Vite**
  - Build Command: `npm run build`
  - Output Directory: `dist`

---

## Google OAuth 2.0 Origin Configuration (Fixing Error 400: origin_mismatch)

When accessing Google Sign-In on the live Vercel domain, Google requires the production URL to be registered under Authorized JavaScript Origins:

1. Open [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
2. Select your project that owns Client ID `880806707459-ci9gcf8sni1h6u0gmd1qtp96mg2u9l9g.apps.googleusercontent.com`.
3. Click on the Client ID under **OAuth 2.0 Client IDs**.
4. Under **Authorized JavaScript origins**, click **+ ADD URI** and add:
   - `https://freshmart-ten-vert.vercel.app`
   - `https://freshmart-ekh27cnj8-piy-jpgs-projects.vercel.app`
   - *(Optional local testing)* `http://localhost:8080`, `http://localhost:5173`
   *(Important: Ensure there is **NO** trailing slash `/`)*
5. Under **Authorized redirect URIs** (optional), add:
   - `https://freshmart-ten-vert.vercel.app`
6. Click **Save**. Allow 2-5 minutes for Google's global OAuth edge caches to update.


