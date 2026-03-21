# todo-app Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-11

## Active Technologies
- TypeScript 5.x + React 18, Next.js 14 (App Router) — **zero new dependencies added** (002-i18n-hooks)
- N/A — message files are static JSON bundled at build time; no runtime fetch (002-i18n-hooks)
- TypeScript 5.x (existing in project) + Next.js 14.2.35 App Router (existing); Firebase 10.x (`firebase` client SDK + `firebase-admin` for server/middleware); Cloud Firestore for task persistence (003-user-auth)
- Cloud Firestore (server-side, per-user task collections) + `localStorage` as read-cache only — replaces current localStorage-only persistence (003-user-auth)

- TypeScript 5.x + React 18, Next.js 14 (App Router), CSS Modules (built-in to Next.js) (001-task-management)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.x: Follow standard conventions

## Recent Changes
- 003-user-auth: Added TypeScript 5.x (existing in project) + Next.js 14.2.35 App Router (existing); Firebase 10.x (`firebase` client SDK + `firebase-admin` for server/middleware); Cloud Firestore for task persistence
- 002-i18n-hooks: Added TypeScript 5.x + React 18, Next.js 14 (App Router) — **zero new dependencies added**

- 001-task-management: Added TypeScript 5.x + React 18, Next.js 14 (App Router), CSS Modules (built-in to Next.js)

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
