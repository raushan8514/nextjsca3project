# LingoPro — Implementation Plan & Phase Execution

## Architectural Strategy

1. **Persistent Relational Database & Full-Stack Server**
   - Implement `server/db.ts` using Node 22 `node:sqlite`.
   - Create schema with 18 tables, indices, and constraints.
   - Implement comprehensive seed data: 5 CEFR courses (English A1, English B1, Spanish A2, French A1, German B1) with 5 lessons each, activities across all 6 modalities, quizzes with hidden answers, subscription plans, initial admin & student accounts.

2. **Server API Layer (`server/index.ts` & `server/routes.ts`)**
   - Authentication routes (`/api/auth/*`): bcrypt password hashing, JWT creation & verification, session hydration.
   - Course & Curriculum routes (`/api/courses/*`, `/api/lessons/*`): catalog, preview, enrollment, 6-modality activity data.
   - Lesson Progress & Practice routes (`/api/lessons/:id/progress`, `/api/activities/attempt`): server-side completion tracking, idempotent XP awards.
   - Quiz Engine (`/api/quizzes/*`): serve questions stripped of answers; server-side grading on submission; attempt records.
   - Dashboard Stats (`/api/dashboard/stats`): aggregate calculations of 6-skill radar, streaks, XP history, completions.
   - Subscriptions & Payments (`/api/payments/*`, `/api/subscriptions/*`): Razorpay test orders, HMAC signature verification, subscription status activation.
   - Certificates (`/api/certificates/*`): authoritative eligibility evaluation, unique ID issuance, public verification endpoint.
   - Admin routes (`/api/admin/*`): user management, course editing, certificate revocation, system audit logs.
   - AI Tutor (`/api/ai/assist`): server-side Gemini 3.8 Flash proxy with strict educational prompt templates and rate limit protection.

3. **Frontend Application Shell & State**
   - Clean architecture:
     * `src/types/index.ts`: comprehensive TypeScript contracts matching backend entities.
     * `src/lib/api.ts`: typed client API wrapper with token handling, interceptors, and error handling.
     * `src/context/AuthContext.tsx`: reactive authentication state, login, register, logout, role check.
     * `src/components/common/*`: Navbar (Top Bar contract), Footer, Toast, Modal, Skeleton loaders, Badges.
     * `src/components/course/*`: Course card, filters, curriculum outline, learning outcomes.
     * `src/components/modalities/*`:
       - `ReadingExercise.tsx`: passage reader, translation toggles, inline dictionary, comprehension check.
       - `ListeningExercise.tsx`: interactive audio player, playback speed (0.75x, 1x, 1.25x), transcript toggler, comprehension.
       - `VideoExercise.tsx`: video player with synced transcript review.
       - `SpeakingExercise.tsx`: Web Audio API mic recording, audio wave playback, pronunciation evaluation.
       - `WritingExercise.tsx`: sentence unscrambler, fill-in-the-blank, open writing prompt with AI grammar review.
       - `GrammarVocabExercise.tsx`: interactive flashcards, rules matrix, matching exercise.
     * `src/components/quiz/QuizPlayer.tsx`: multi-step quiz runner with server-side grading review and score breakdown.
     * `src/components/certificate/CertificateModal.tsx`: printable high-res certificate with print stylesheet.
     * `src/components/ai/AiTutorDrawer.tsx`: slide-over AI language companion with quick-prompt suggestions.

4. **Public & Private Page Views**
   - Landing Page (`/`): Top bar, hero with generated visual asset, feature highlights, course catalog preview, pricing tiers, FAQ, footer.
   - Courses Catalog (`/courses`, `/courses/:id`): search, filters, course syllabus, enrollment CTA.
   - Public Certificate Verification (`/verify`, `/verify/:id`): authoritative proof verification.
   - Student Dashboard (`/dashboard`): streak counter, 6-skill proficiency radar, continued lessons, achievements, recent activity.
   - Student Lesson Player (`/lessons/:id`): sequential 6-modality learning experience with real-time completion state.
   - Student Quizzes & Exams (`/quizzes/:id`): assessment runner.
   - Student Subscription & Billing (`/subscription`): plan selection, Razorpay test payment modal, invoice history.
   - Admin Dashboard (`/admin`): platform overview, student roster, course management, certificate revocation console.

5. **Testing, Verification & Handover**
   - Automated server integration test script (`server/tests.ts`).
   - Run compilation and typecheck tests.
   - Validate that answers are never leaked in quiz payload, paid access requires verified payment, and certificates cannot be claimed without passing.
