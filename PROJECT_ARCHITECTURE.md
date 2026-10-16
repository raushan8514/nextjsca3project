# LingoPro — Project Architecture & System Design

**Product**: LingoPro  
**Tagline**: *Learn Languages. Track Progress. Prove Your Skills.*  
**Context**: Full-Stack EdTech SaaS for University CA-3 Capstone & Realistic Production Demonstration  

---

## 1. System Overview

LingoPro is a production-minded full-stack language-learning platform designed with clear separation of concerns, authoritative server-side validation, persistent relational storage, role-based access control, test-mode payment gateway integration, and CEFR-aligned pedagogy across six learning modalities.

```
+-----------------------------------------------------------------------------------+
|                                  BROWSER CLIENT                                   |
|   React 19 + Tailwind CSS + Lucide Icons + Motion + Canvas Confetti              |
|   - Public Landing, Course Catalog, Pricing & Verification                        |
|   - Student App Shell (Dashboard, 6-Modality Engine, Quizzes, Certificates)      |
|   - Admin App Shell (User Management, Course/Lesson CRUD, Audit, Revocation)      |
+-----------------------------------------------------------------------------------+
                                         │  HTTP / REST (JSON + Bearer JWT)
                                         ▼
+-----------------------------------------------------------------------------------+
|                                 EXPRESS BACKEND                                   |
|   Node.js 22 + TypeScript + tsx                                                   |
|   - Authentication Middleware (JWT verification, role guards)                     |
|   - Server-Side Quiz Grading Engine (Hidden Answer Keys)                          |
|   - Authoritative Certificate Eligibility & Verification Engine                   |
|   - Razorpay Test-Mode Payment & Webhook Verification Service                     |
|   - AI Language Tutor Gateway (Google GenAI / Gemini 3.8 Flash)                   |
|   - Vite Development Middleware Integration                                       |
+-----------------------------------------------------------------------------------+
                                         │  ACID Transactions / Prepared Statements
                                         ▼
+-----------------------------------------------------------------------------------+
|                              PERSISTENT DATABASE                                  |
|   SQLite via Node 22 `node:sqlite` (Stored at `/data/lingopro.db`)                |
|   - 18 Relational Tables with Foreign Keys, Unique Constraints & Indexes          |
|   - Idempotent Seed Pipeline with Sample Curriculum & Seed Accounts               |
+-----------------------------------------------------------------------------------+
```

---

## 2. Architectural Boundaries & Data Flow

1. **Client-Server Boundary**:
   - The React client never contains grading answer keys, payment secrets, or bypass privileges.
   - State updates in the client are speculative until verified and returned by HTTP status 200/201 from the backend.
   - Authentication tokens are signed with a server-held secret and validated on every protected API call.

2. **Authorization & RBAC**:
   - Two distinct roles: `USER` (Student) and `ADMIN` (Administrator).
   - Public registration route `/api/auth/register` is hardcoded to assign `USER` role only.
   - Admin routes `/api/admin/*` reject non-admin tokens with HTTP 403 Forbidden.
   - Resource access checks enforce that students can only inspect their own enrollments, quiz attempts, and payment records.

3. **Storage & Persistence**:
   - High-performance, zero-maintenance embedded SQLite engine (`node:sqlite`) with WAL mode enabled.
   - Data persists across server restarts in `/data/lingopro.db`.
   - Complete foreign key integrity on delete/cascade and atomic multi-table updates.

4. **Curriculum & 6-Modality Architecture**:
   - Six interconnected modalities:
     * **Reading**: Passages, translation toggle, interactive glossary, comprehension check.
     * **Listening**: Playable audio synthesizers/audio tracks, playback speed (0.75x, 1x, 1.25x), toggleable transcript, comprehension checks.
     * **Video**: Curated video lectures with synchronized caption tracks and post-video checks.
     * **Speaking**: Browser microphone capture, audio visualizer, playback, pronunciation evaluation via AI or phonetic matcher.
     * **Writing**: Fill-in-the-blank, word sentence reconstructor, free-text prompt with rule-based grammar validation and AI review.
     * **Grammar & Vocabulary**: Interactive flashcards, rule breakdown tables, and quick-check drills.

5. **Authoritative Assessments & Certificates**:
   - Quizzes are stored on the server. On question retrieval, `correct_answer_json` is stripped completely.
   - Submissions are evaluated strictly on the server; scores, XP, and streaks are awarded atomically.
   - Certificates are issued only when:
     1. All required course lessons are recorded as `completed` in `lesson_progress`.
     2. The course final assessment has been passed with $\ge 70\%$.
   - Public certificate verification is openly queryable via `/api/certificates/verify/:certId` without requiring user authentication, returning verified student name, course title, and completion date while preserving private account data.

6. **Payment & Subscription Architecture**:
   - Razorpay test-mode integration.
   - Server-side order creation via `/api/payments/create-order` ensures prices cannot be tampered with on client.
   - Client performs Razorpay checkout modal or simulated test sandbox.
   - Verification endpoint `/api/payments/verify` computes HMAC SHA256 signature and activates subscription atomically.
   - Idempotent webhook handler ensures delayed or duplicate gateway events do not duplicate credit.

7. **Optional AI Language Assistant**:
   - Uses `@google/genai` TypeScript SDK with model `gemini-3.8-flash`.
   - Proxy endpoint `/api/ai/assist` handles tutoring queries (grammar explanations, sentence correction, pronunciation breakdown).
   - Server validates payload length and safeguards API key exposure.
