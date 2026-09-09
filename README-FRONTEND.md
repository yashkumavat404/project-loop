# LOOP Frontend

Frontend ownership: dashboard, inbox, trends, Ask LOOP, reports, auth UI, shared components and API integration.

## Stack
- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Recharts
- Lucide React

## Important integration rule
All backend communication is centralized in `lib/api.ts` and all shared payload shapes are centralized in `lib/types.ts`.

When the backend is merged, update these two files first if Mani's actual route names or response shapes differ. Avoid scattering `fetch()` calls through page components.

## Run
```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Frontend routes
- `/login`
- `/signup`
- `/dashboard`
- `/inbox`
- `/trends`
- `/ask`
- `/reports`
- `/settings`

The current UI uses graceful demo fallback data when the API is unavailable. This makes the frontend work before backend integration, but production/demo data should come from the real API.
