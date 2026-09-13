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

