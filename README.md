# Whispera

Whispera is a modern chat UI built with Next.js, React and Convex. The app focuses on a polished, fast messaging experience with smooth animations (framer-motion), lightweight in-app notifications and a small set of reusable UI components.

This repository contains the Whispera client and a small set of Convex-backed server functions — everything you need to run the app locally and deploy to Vercel or another Node hosting provider.

Highlights

- Fast, reactive chat UI using Convex for backend data.
- Smooth animations via `framer-motion`.
- Lightweight in-app notifications with optional browser Notification API (no background push by default).
- Small, reusable UI primitives (buttons, spinner, dialogs).

Important: Background web push (service workers + VAPID) has been intentionally removed from the default codebase. Whispera still supports in-app notifications and the browser Notification API while the app is running. If you need background push (notifications when the browser is closed), we can add a new, tested push implementation separately.

Table of contents

- Getting started
- Scripts
- Local development
- Production build & deploy
- Project layout
- Notifications
- Troubleshooting & tips
- Contributing

Getting started

1. Install dependencies

```powershell
npm install
# or
pnpm install
# or
yarn
```

2. Run the dev server

```powershell
npm run dev
# Open http://localhost:3000
```

Scripts

- `npm run dev` — Run Next.js in development mode
- `npm run build` — Create an optimized production build
- `npm run start` — Run the production build locally (after `npm run build`)

Local development notes

- The chat UI uses Convex for real-time sync. Ensure Convex is configured and the `convex/` files are present (they live under `convex/` and a generated client is used in `convex/_generated/api`).
- The app is an opinionated Next.js app (app router). Pages and UI components live under `app/` and `components/`.

Project layout (short)

- `app/` — Next.js app routes and top-level layouts
- `components/` — Reusable UI primitives and feature components (chat panel, header, footer)
- `components/ui/` — Small UI building blocks (Spinner, button, input)
- `convex/` — Convex functions & schema / generated API
- `public/` — Static assets
- `README.md` — This file

Notifications

- The project intentionally does not register a service worker by default. Background push (when browser is closed) was removed because it requires careful VAPID management, secure hosting (HTTPS), and subscription lifecycle maintenance.
- In-app notifications are implemented using `react-hot-toast`, a small audio chime and the browser Notification API (when the user grants permission). This provides a reliable UX while the app is running.
- If you want background push later, I can add a dedicated, documented implementation that:
	- Adds a tested `public/sw.js` service worker
	- Implements VAPID key management and server-side sending (web-push)
	- Exposes an admin UI to view and manage subscriptions

Production & deployment

1. Build the app

```powershell
npm run build
```

2. Run production

```powershell
npm run start
```

Deploy to Vercel

1. Connect this repo to Vercel and set any environment variables you need.
2. Push to the default branch (e.g. `main`) and Vercel will build and deploy automatically.

Troubleshooting & tips

- If the app fails to start, run `npm run build` locally and inspect TypeScript/ESLint output.
- If message syncing doesn't work, ensure Convex is configured correctly and your Convex client keys are accessible to the running process.
- For Notification permission issues: open DevTools → Application → Notifications (or check browser-specific notification settings). The app will prompt the user for permission using the small UI control in the header.

Contributing

Contributions, issues and feature requests are welcome. If you'd like to help:

1. Fork the repository
2. Create a feature branch
3. Open a PR with a clear description of your changes

If you want me to reintroduce background push (service worker + VAPID) with a secure workflow and admin UI, say the word and I will add a separate, well-tested implementation and document the required env vars.

License

This project is provided as-is. Add your project license here.

