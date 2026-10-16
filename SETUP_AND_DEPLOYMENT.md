# LingoPro — Setup, Configuration and Deployment Guide

## 1. Quick Start (Development)

LingoPro is a complete full-stack TypeScript application with an Express backend and React SPA frontend.

### Prerequisites
- Node.js >= 22.0.0 (uses built-in `node:sqlite`)
- npm >= 10.0.0

### Installation & Launch
```bash
# Install dependencies
npm install

# Start the full-stack server (runs Express API on port 3000 with Vite middleware)
npm run dev
```

Visit the application at: `http://localhost:3000`

---

## 2. Seed Accounts & Credentials

The embedded database automatically initialises and seeds sample curriculum, quizzes, and default accounts on first run:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Administrator** | `admin@lingopro.edu` | `Admin@LingoPro2026!` |
| **Demo Student** | `student@lingopro.edu` | `Student@LingoPro2026!` |

You can also register a brand new student account directly in the UI. All public registrations receive the `USER` role; administrative accounts can never be created via public signup.

---

## 3. Environment Variables

Create a `.env` file based on `.env.example`:

```ini
# Port for the Express server (default: 3000)
PORT=3000

# Secret key for signing JWT user session tokens
JWT_SECRET=lingopro_jwt_super_secret_key_2026_production

# Google Gemini API Key for AI Language Tutor features
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE

# Razorpay Test Mode Credentials (Optional - Test Sandbox Mode enabled by default)
RAZORPAY_KEY_ID=rzp_test_sampleKey123
RAZORPAY_KEY_SECRET=sampleSecretKey123
```

---

## 4. Database Architecture & Persistence

- Engine: Embedded SQLite via Node.js 22 `node:sqlite` (`DatabaseSync`).
- Location: Stored on disk at `./data/lingopro.db`.
- WAL Mode: Enabled (`PRAGMA journal_mode = WAL;`) for high concurrency and zero locking issues.
- Migrations & Seed: Evaluated automatically on server startup in `server/db.ts`.

---

## 5. Production Build & Deployment

To build and package for production deployment (e.g. Cloud Run, Render, Railway, VPS):

```bash
# 1. Compile frontend client bundle
npm run build

# 2. Run automated server integration tests
npm run test:server

# 3. Start production server
npm start
```

### Production Checklist
1. Ensure the `./data` directory has persistent volume mounting on container hosts.
2. Provide a strong, random `JWT_SECRET`.
3. Provide a valid `GEMINI_API_KEY` for AI tutoring.
4. Set `NODE_ENV=production`.
