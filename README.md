# GrammoQuest

**"Learn English Grammar Through Play"**

A gamified English grammar learning platform (PWA + LMS) for school students and independent learners.

---

## Project Structure

```
LMS/
├── frontend/     React + TypeScript + Vite PWA
└── backend/      Go REST API
```

---

## Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file and fill in your Firebase values
cp .env.example .env

# Run development server (http://localhost:5173)
npm run dev
```

**Required `.env` values** (see `frontend/.env.example`):
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

---

## Backend Setup

> Requires [Go 1.22+](https://go.dev/dl/)

```bash
cd backend

# Download dependencies
go mod tidy

# Copy environment file and fill in your Firebase values
cp .env.example .env

# Place your Firebase service account key (download from Firebase Console)
# at: backend/firebase-service-account.json
# NEVER commit this file to Git.

# Run development server (http://localhost:8080)
go run ./cmd/server
```

**Required `.env` values** (see `backend/.env.example`):
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CREDENTIALS_FILE` (path to service account key JSON)

---

## Architecture

```
React PWA (localhost:5173)
       ↕ /api/v1/* (proxied in dev)
Go REST API (localhost:8080)
       ↕
Firebase Auth + Firestore
```

**Key architectural rules:**
- `correctAnswer` is **never** sent to the frontend
- All quiz scoring (score, stars, XP, passed) is calculated server-side
- `UnlockRequest` is created only after ALL unit quizzes pass at ≥90%
- `chapterStatus` is only written by the Go backend — never the frontend
- Role is always verified from Firestore — never from JWT claims

---

## Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable **Authentication** → Google provider + Email/Password provider
4. Enable **Firestore Database** (start in test mode for development)
5. Enable **Storage**
6. Download service account key: Project Settings → Service Accounts → Generate new private key
7. Fill in both `.env` files

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS v3 |
| State | Zustand + TanStack Query |
| Animations | Framer Motion + Lottie |
| PWA | vite-plugin-pwa |
| Backend | Go 1.22 |
| Auth | Firebase Authentication |
| Database | Cloud Firestore |
| Storage | Firebase Storage |

---

## Milestones

- [x] **M1** — Foundation + Auth + Landing
- [x] **M2** — Curriculum + Dashboards
- [ ] **M3** — Quiz Engine (start/submit/result)
- [ ] **M4** — Mastery + Admin Unlock Flow
- [ ] **M5** — Gamification (XP, streaks, badges)
- [ ] **M6** — Practice Arena + Leaderboard
- [ ] **M7** — Bot Race
- [ ] **M8** — Teacher & School panels

---

## Firestore Seed (Required for M2)

After setting up Firebase, seed initial curriculum data:

```bash
cd backend

# Install seed dependencies (one-time)
npm install

# Copy your Firebase service account key to:
# backend/firebase-service-account.json

# Run seed (add ADMIN_UID to also create the admin user)
FIREBASE_PROJECT_ID=your-project-id node seed.js

# With admin user:
FIREBASE_PROJECT_ID=your-project-id ADMIN_UID=<firebase-auth-uid> node seed.js
```

This seeds:
- **1 Unit** — The Simple Present Tense
- **3 Chapters** — Subject-Verb Agreement, Positive/Negative Forms, Questions
- **3 Quizzes** — 5 questions each (MCQ, True/False, Fill-in-blank, Reorder)
- **15 Questions** — Real grammar content

---

## Available Routes (M2)

### Frontend
| Route | Description |
|---|---|
| `/` | Landing page |
| `/login` | Login (school email+pass / independent Google) |
| `/register` | Independent student registration |
| `/dashboard` | Student journey map + stats |
| `/units/:unitId` | Chapter list for a unit |
| `/chapters/:chapterId` | Chapter detail + Start Quiz CTA |
| `/admin` | Admin dashboard (role-guarded) |

### Backend API
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/profile` | Create/get user profile |
| GET | `/api/v1/auth/me` | Current user profile |
| GET | `/api/v1/units` | Units with student status |
| GET | `/api/v1/units/:id/chapters` | Chapters with status |
| GET | `/api/v1/chapters/:id` | Chapter detail |
| GET | `/api/v1/progress` | Student progress |
| GET | `/api/v1/admin/users` | All users (admin only) |
| POST | `/api/v1/admin/users/:uid/approve` | Approve student |
| POST | `/api/v1/admin/users/:uid/suspend` | Suspend user |
