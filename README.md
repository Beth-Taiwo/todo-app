# Todo App

A personal task manager built with Next.js 14, TypeScript, and Firebase — supporting task creation, completion, archiving, internationalization, and user authentication with cross-device sync.

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Install dependencies

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Testing

```bash
npm test          # run all tests once
npm run test:watch # watch mode
```

The test suite uses **Vitest** + **@testing-library/react**. Tests run in jsdom — no browser required.

## Authentication Setup

This app uses **Firebase Authentication** (email/password) and **Cloud Firestore** for cross-device task storage.

### 1. Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. Enable **Email/Password** authentication under _Authentication → Sign-in method_.
3. Create a **Cloud Firestore** database (start in production mode).
4. Deploy Firestore Security Rules (see below).

### 2. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in your credentials:

```bash
cp .env.local.example .env.local
```

**Client SDK values** — from _Firebase Console → Project Settings → Your apps → Web app_:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

**Admin SDK values** — from _Project Settings → Service accounts → Generate new private key_:

```env
FIREBASE_ADMIN_PROJECT_ID=...
FIREBASE_ADMIN_CLIENT_EMAIL=...
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 3. Start Firebase Emulators (local development)

Install the Firebase CLI if needed:

```bash
npm install -g firebase-tools
firebase login
```

Start emulators:

```bash
firebase emulators:start
```

This starts the **Auth emulator** on port 9099 and **Firestore emulator** on port 8080. The app connects to emulators automatically when `NODE_ENV=development`.

The Emulator UI is available at [http://localhost:4000](http://localhost:4000).

### 4. Deploy Firestore Security Rules

```bash
firebase deploy --only firestore:rules
```

This deploys `firestore.rules`, which ensures users can only read and write their own tasks.

## Project Structure

```
src/
├── app/                  # Next.js App Router pages + API routes
│   ├── api/auth/         # session, logout, me API routes
│   ├── login/            # Login page
│   ├── register/         # Registration page
│   ├── forgot-password/  # Password reset request page
│   └── reset-password/   # Password reset confirmation page
├── components/           # React UI components
├── context/              # AuthContext, TaskContext
├── lib/                  # firebase, authService, taskService, i18n
├── middleware.ts          # Route protection (Next.js edge middleware)
└── types/                # TypeScript types (Task, AuthUser, AuthState)
messages/
└── en.json               # i18n strings
tests/
├── unit/                 # Pure logic tests (authService, taskService, reducers)
├── integration/          # Component + context integration tests
└── contract/             # Shape/schema validation tests
```
