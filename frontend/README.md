# FitTrack AI frontend

## Deploy to Vercel

This repository contains a Vite frontend and a separate Express backend. Deploy
the frontend to Vercel and keep the backend on Render or another Node.js host;
the backend currently starts a persistent Express listener and is not configured
as a Vercel serverless function.

In the Vercel project settings, set:

- **Root Directory:** `frontend`
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

Set `VITE_API_URL` to the backend URL if it differs from the production default
in `src/api.js`. It may be the backend origin (for example,
`https://api.example.com`) or the API base URL ending in `/api`. This variable is
embedded in the frontend at build time, so redeploy after changing it.

On the backend host, set `FRONTEND_URL` to the deployed Vercel origin, with no
trailing slash (for example, `https://fittrack-ai.vercel.app`). For Vercel
preview deployments, comma-separate any additional allowed origins.

The backend also requires `MONGO_URI`, `JWT_SECRET`, and `GEMINI_API_KEY`.
Configure these only in the backend host's environment settings, not in Vercel
frontend variables.

## Local development

Install dependencies and run the frontend from this directory:

```sh
npm install
npm run dev
```

Run the backend separately from `../backend` with `npm install` and
`npm run dev`. The frontend uses `http://localhost:5000` for the API during
local development.
