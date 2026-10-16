# LingoPro — Full-Stack Language Learning SaaS

> **Tagline**: Learn Languages. Track Progress. Prove Your Skills.  
> **Academic Capstone**: University CA-3 Project Demonstration  

LingoPro is a production-grade EdTech SaaS platform designed to deliver immersive language mastery through structured CEFR-aligned coursework, an interactive 6-modality learning engine (Reading, Listening, Video, Speaking, Writing, Grammar/Vocabulary), server-graded assessments, verifiable cryptographic certificates, test-mode subscriptions, and administrative control.

---

## Key Highlights

- **Real Persistent Database**: Built on Node.js 22 embedded SQLite with ACID transactions, foreign keys, unique constraints, and WAL mode.
- **Strict Role-Based Security**: Complete separation of Student (`USER`) and Administrator (`ADMIN`) workflows. Server-enforced role checks and hidden quiz answer keys.
- **6-Modality Practice Engine**:
  1. *Reading*: Passages with inline glossary, translation toggling, and reading comprehension.
  2. *Listening*: Playable native-like audio, variable playback speed (0.75x–1.25x), sync transcripts.
  3. *Video*: Curated visual lectures with synchronized subtitle review and checks.
  4. *Speaking*: In-browser mic capture, audio waveform playback, retake controls, and AI pronunciation breakdown.
  5. *Writing*: Sentence reconstructor, fill-in-the-blank drills, and free-text writing with instant grammar feedback.
  6. *Grammar & Vocabulary*: Interactive flashcards, grammatical paradigm tables, and review drills.
- **Authoritative Certificates**: Cryptographically unique IDs (`LP-YYYY-LANG-XXXX`) issued only when all units are completed and final exams passed ($\ge 70\%$). Includes public verification at `/verify`.
- **Test-Mode Subscriptions**: Razorpay sandbox with server-side order generation and signature verification.
- **AI Language Companion**: Powered by Google GenAI (`gemini-3.8-flash`) for real-time grammar explanations, contextual translations, and pronunciation tips.
- **Comprehensive Admin Panel**: Real aggregated metrics, course/lesson editor, student roster, and certificate revocation system.

---

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

### Default Credentials
- **Admin**: `admin@lingopro.edu` / `Admin@LingoPro2026!`
- **Student**: `student@lingopro.edu` / `Student@LingoPro2026!`
