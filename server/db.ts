import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'lingopro.db');
export const db = new DatabaseSync(DB_PATH);

// Enable WAL mode for concurrency and foreign key enforcement
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'USER',
      streak_days INTEGER DEFAULT 1,
      last_active_date TEXT,
      xp INTEGER DEFAULT 50,
      avatar_url TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT NOT NULL,
      language TEXT NOT NULL,
      cefr_level TEXT NOT NULL,
      image_url TEXT NOT NULL,
      is_premium INTEGER DEFAULT 0,
      learning_outcomes_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lessons (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      duration_minutes INTEGER NOT NULL DEFAULT 15,
      is_free_preview INTEGER DEFAULT 0,
      modality_flags_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lesson_activities (
      id TEXT PRIMARY KEY,
      lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      modality TEXT NOT NULL,
      title TEXT NOT NULL,
      content_json TEXT NOT NULL,
      order_index INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS enrollments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      enrolled_at TEXT NOT NULL,
      completed_at TEXT,
      progress_percent INTEGER DEFAULT 0,
      UNIQUE(user_id, course_id)
    );

    CREATE TABLE IF NOT EXISTS lesson_progress (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'in_progress',
      completed_at TEXT,
      UNIQUE(user_id, lesson_id)
    );

    CREATE TABLE IF NOT EXISTS practice_attempts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      modality TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      score INTEGER,
      feedback TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      lesson_id TEXT REFERENCES lessons(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      passing_score INTEGER DEFAULT 70,
      is_final_assessment INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS quiz_questions (
      id TEXT PRIMARY KEY,
      quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
      prompt TEXT NOT NULL,
      type TEXT NOT NULL,
      options_json TEXT NOT NULL,
      correct_answer_json TEXT NOT NULL,
      explanation TEXT NOT NULL,
      order_index INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
      score INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      passed INTEGER NOT NULL,
      submitted_answers_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subscription_plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price_inr INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'INR',
      billing_cycle TEXT NOT NULL DEFAULT 'monthly',
      features_json TEXT NOT NULL,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plan_id TEXT NOT NULL REFERENCES subscription_plans(id),
      status TEXT NOT NULL DEFAULT 'free',
      order_id TEXT,
      payment_id TEXT,
      starts_at TEXT NOT NULL,
      ends_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      order_id TEXT NOT NULL,
      payment_id TEXT NOT NULL,
      amount_inr INTEGER NOT NULL,
      status TEXT NOT NULL,
      gateway TEXT NOT NULL DEFAULT 'razorpay_test',
      receipt_number TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payment_webhook_events (
      id TEXT PRIMARY KEY,
      event_id TEXT UNIQUE NOT NULL,
      event_name TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      processed_at TEXT NOT NULL,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      recipient_name TEXT NOT NULL,
      course_title TEXT NOT NULL,
      issue_date TEXT NOT NULL,
      final_score INTEGER NOT NULL,
      is_revoked INTEGER DEFAULT 0,
      revoked_reason TEXT,
      revoked_at TEXT,
      UNIQUE(user_id, course_id)
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      xp_reward INTEGER NOT NULL DEFAULT 50
    );

    CREATE TABLE IF NOT EXISTS user_achievements (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      achievement_id TEXT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
      unlocked_at TEXT NOT NULL,
      UNIQUE(user_id, achievement_id)
    );

    CREATE TABLE IF NOT EXISTS xp_ledger (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      reason TEXT NOT NULL,
      source_type TEXT NOT NULL,
      source_id TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_user_id TEXT,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT NOT NULL,
      details_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ai_usage_records (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      prompt_type TEXT NOT NULL,
      tokens_approx INTEGER NOT NULL DEFAULT 50,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS live_classes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      course_id TEXT REFERENCES courses(id) ON DELETE SET NULL,
      lesson_id TEXT REFERENCES lessons(id) ON DELETE SET NULL,
      instructor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      instructor_name TEXT NOT NULL,
      scheduled_at TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL DEFAULT 45,
      max_capacity INTEGER NOT NULL DEFAULT 25,
      status TEXT NOT NULL DEFAULT 'scheduled',
      room_name TEXT NOT NULL,
      recording_url TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS live_class_registrations (
      id TEXT PRIMARY KEY,
      class_id TEXT NOT NULL REFERENCES live_classes(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      registered_at TEXT NOT NULL,
      UNIQUE(class_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS live_class_attendance (
      id TEXT PRIMARY KEY,
      class_id TEXT NOT NULL REFERENCES live_classes(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      user_name TEXT NOT NULL,
      user_role TEXT NOT NULL,
      joined_at TEXT NOT NULL,
      left_at TEXT,
      duration_seconds INTEGER DEFAULT 0,
      UNIQUE(class_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS live_class_messages (
      id TEXT PRIMARY KEY,
      class_id TEXT NOT NULL REFERENCES live_classes(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      user_name TEXT NOT NULL,
      user_role TEXT NOT NULL,
      message TEXT NOT NULL,
      is_announcement INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
    CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON lesson_progress(user_id, course_id);
    CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id, quiz_id);
    CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
    CREATE INDEX IF NOT EXISTS idx_certificates_user ON certificates(user_id);
    CREATE INDEX IF NOT EXISTS idx_live_classes_sched ON live_classes(scheduled_at, status);
    CREATE INDEX IF NOT EXISTS idx_live_class_reg_user ON live_class_registrations(user_id);
  `);

  // Safe schema updates for existing tables
  try { db.exec("ALTER TABLE courses ADD COLUMN status TEXT DEFAULT 'published';"); } catch {}
  try { db.exec("ALTER TABLE courses ADD COLUMN prerequisites_json TEXT DEFAULT '[]';"); } catch {}
  try { db.exec("ALTER TABLE courses ADD COLUMN duration_hours INTEGER DEFAULT 10;"); } catch {}
  try { db.exec("ALTER TABLE courses ADD COLUMN price_inr INTEGER DEFAULT 0;"); } catch {}
  try { db.exec("ALTER TABLE lessons ADD COLUMN status TEXT DEFAULT 'published';"); } catch {}
  try { db.exec("ALTER TABLE lessons ADD COLUMN objectives_json TEXT DEFAULT '[]';"); } catch {}
  try { db.exec("ALTER TABLE quizzes ADD COLUMN time_limit_minutes INTEGER DEFAULT 20;"); } catch {}
  try { db.exec("ALTER TABLE quiz_questions ADD COLUMN marks INTEGER DEFAULT 1;"); } catch {}

  seedInitialData();
  seedLiveClasses();
}

function seedInitialData() {
  const userCount = db.prepare('SELECT count(*) as count FROM users').get() as { count: number };
  if (userCount && userCount.count > 0) {
    return; // Already seeded
  }

  const now = new Date().toISOString();
  const today = now.slice(0, 10);

  // 1. Seed Accounts
  const adminPassHash = bcrypt.hashSync('Admin@LingoPro2026!', 10);
  const studentPassHash = bcrypt.hashSync('Student@LingoPro2026!', 10);

  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, streak_days, last_active_date, xp, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(
    'usr_admin_001',
    'Administrator',
    'admin@lingopro.edu',
    adminPassHash,
    'ADMIN',
    14,
    today,
    950,
    now
  );

  insertUser.run(
    'usr_student_001',
    'Raushan Kumar',
    'student@lingopro.edu',
    studentPassHash,
    'USER',
    7,
    today,
    380,
    now
  );

  // 2. Subscription Plans
  const insertPlan = db.prepare(`
    INSERT INTO subscription_plans (id, name, price_inr, currency, billing_cycle, features_json, is_active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `);

  insertPlan.run(
    'plan_free',
    'Free Starter',
    0,
    'INR',
    'monthly',
    JSON.stringify([
      'Access to Level A1 Foundation Courses',
      'Basic Reading & Vocabulary Drills',
      'Standard Quiz Practice',
      'Community Discussions'
    ])
  );

  insertPlan.run(
    'plan_pro',
    'Pro Scholar',
    299,
    'INR',
    'monthly',
    JSON.stringify([
      'All CEFR Courses (A1 to B2)',
      'Full 6-Modality Engine (Speaking & Audio)',
      'AI Language Companion Feedback',
      'Official Verifiable Certificates',
      'Weekly Skill Analytics'
    ])
  );

  insertPlan.run(
    'plan_premium',
    'Global Career Pass',
    599,
    'INR',
    'monthly',
    JSON.stringify([
      'Everything in Pro Scholar',
      'Professional C1 Business English & Working Abroad Modules',
      'Priority Server-Graded Exam Reviews',
      'Direct Certificate Export & LinkedIn Badging',
      'Unlimited Speaking Pronunciation Checks'
    ])
  );

  // Assign demo student a free plan initially
  db.prepare(`
    INSERT INTO subscriptions (id, user_id, plan_id, status, starts_at, ends_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('sub_student_init', 'usr_student_001', 'plan_free', 'free', now, new Date(Date.now() + 365 * 86400000).toISOString());

  // 3. Achievements
  const insertAchievement = db.prepare(`
    INSERT INTO achievements (id, code, title, description, icon, xp_reward)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const achievementsData = [
    ['ach_first_step', 'FIRST_STEP', 'First Step', 'Complete your very first lesson activity', 'Compass', 30],
    ['ach_polyglot_mind', 'POLYGLOT', 'Language Enthusiast', 'Enroll in at least two different languages', 'Globe', 50],
    ['ach_streak_3', 'STREAK_3', 'On Fire', 'Maintain a 3-day practice streak', 'Flame', 60],
    ['ach_streak_7', 'STREAK_7', 'Unstoppable Habit', 'Maintain a 7-day practice streak', 'Zap', 120],
    ['ach_quiz_master', 'QUIZ_ACE', 'Sharp Mind', 'Score 100% on any lesson assessment', 'Award', 100],
    ['ach_speaking_pro', 'VOCAL_FLOW', 'Vocal Confidence', 'Record 5 speaking practice submissions', 'Mic', 80],
    ['ach_certified', 'CERTIFIED_ACHIEVER', 'Certified Achiever', 'Earn your first official course completion certificate', 'FileCheck', 200]
  ];

  for (const a of achievementsData) {
    insertAchievement.run(a[0], a[1], a[2], a[3], a[4], a[5]);
  }

  // Grant demo student first achievements
  db.prepare('INSERT INTO user_achievements (id, user_id, achievement_id, unlocked_at) VALUES (?, ?, ?, ?)').run(
    'uach_1', 'usr_student_001', 'ach_first_step', now
  );
  db.prepare('INSERT INTO user_achievements (id, user_id, achievement_id, unlocked_at) VALUES (?, ?, ?, ?)').run(
    'uach_2', 'usr_student_001', 'ach_streak_7', now
  );

  // 4. Starter Courses
  const insertCourse = db.prepare(`
    INSERT INTO courses (id, title, slug, description, language, cefr_level, image_url, is_premium, learning_outcomes_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const coursesData = [
    {
      id: 'crs_eng_a1',
      title: 'English A1 — Everyday Foundations',
      slug: 'english-a1-everyday-foundations',
      description: 'Master essential English for everyday interactions, greetings, ordering at cafes, and navigating daily conversations with confidence.',
      language: 'English',
      cefr_level: 'A1',
      image_url: '/src/assets/images/hero_language_learner_1792167190387.jpg',
      is_premium: 0,
      outcomes: [
        'Introduce yourself and ask basic personal questions',
        'Order meals and drinks in cafes and restaurants',
        'Understand simple directions and daily routines',
        'Recognize numbers, prices, times, and dates'
      ]
    },
    {
      id: 'crs_eng_b1',
      title: 'English B1 — Professional English',
      slug: 'english-b1-professional-english',
      description: 'Elevate your international career with professional vocabulary, meeting participation techniques, formal emails, and presentations.',
      language: 'English',
      cefr_level: 'B1',
      image_url: '/src/assets/images/course_english_pro_1792167190678.jpg',
      is_premium: 1,
      outcomes: [
        'Lead and participate actively in corporate meetings',
        'Write crisp, professional emails and status reports',
        'Deliver data-backed business presentations',
        'Handle negotiations and polite disagreements'
      ]
    },
    {
      id: 'crs_esp_a2',
      title: 'Spanish A2 — Conversational Spanish',
      slug: 'spanish-a2-conversational-spanish',
      description: 'Bridge from beginner to conversational fluency with practical dialogues for travel, dining, shopping, and everyday Latin American and Iberian life.',
      language: 'Spanish',
      cefr_level: 'A2',
      image_url: '/src/assets/images/course_spanish_conv_1792167191515.jpg',
      is_premium: 0,
      outcomes: [
        'Hold spontaneous conversations about daily activities',
        'Ask for travel directions, train tickets, and hotel bookings',
        'Express past experiences using the preterite and imperfect',
        'Describe neighborhoods, tastes, and future plans'
      ]
    },
    {
      id: 'crs_fra_a1',
      title: 'French A1 — French Foundations',
      slug: 'french-a1-french-foundations',
      description: 'Discover the beauty of the French language. Learn core pronunciation, foundational vocabulary, cafe etiquette, and cultural essentials.',
      language: 'French',
      cefr_level: 'A1',
      image_url: '/src/assets/images/course_french_foundations_1792167192770.jpg',
      is_premium: 0,
      outcomes: [
        'Master the French nasal vowels and liaison pronunciation',
        'Order food and beverages in authentic Parisian bistros',
        'Describe family, occupations, and simple living spaces',
        'Conjugate essential regular -er verbs and être/avoir'
      ]
    },
    {
      id: 'crs_deu_b1',
      title: 'German B1 — Working & Living in Germany',
      slug: 'german-b1-working-and-living-in-germany',
      description: 'Practical German for professionals and expats. Navigate German workplace communication, official administrative tasks, and social life.',
      language: 'German',
      cefr_level: 'B1',
      image_url: '/src/assets/images/course_german_career_1792167191933.jpg',
      is_premium: 1,
      outcomes: [
        'Communicate effectively in German business environments',
        'Understand official correspondence and registration letters',
        'Express complex arguments using subordinate clauses (weil, dass, obwohl)',
        'Participate in team retrospectives and technical standups'
      ]
    }
  ];

  for (const c of coursesData) {
    insertCourse.run(
      c.id,
      c.title,
      c.slug,
      c.description,
      c.language,
      c.cefr_level,
      c.image_url,
      c.is_premium,
      JSON.stringify(c.outcomes),
      now
    );
  }

  // 5. Seed 5 Lessons for Each Course with 6-Modality Activities and End-of-Course Quizzes
  seedLessonsAndCurriculum();

  // 6. Enroll student in English A1 and set initial lesson completed
  db.prepare(`
    INSERT INTO enrollments (id, user_id, course_id, enrolled_at, progress_percent)
    VALUES (?, ?, ?, ?, ?)
  `).run('enr_stud_eng1', 'usr_student_001', 'crs_eng_a1', now, 40);

  // Mark lessons 1 and 2 completed for demo student
  db.prepare(`
    INSERT INTO lesson_progress (id, user_id, lesson_id, course_id, status, completed_at)
    VALUES (?, ?, ?, ?, 'completed', ?)
  `).run('lp_s1_l1', 'usr_student_001', 'les_eng_a1_1', 'crs_eng_a1', now);

  db.prepare(`
    INSERT INTO lesson_progress (id, user_id, lesson_id, course_id, status, completed_at)
    VALUES (?, ?, ?, ?, 'completed', ?)
  `).run('lp_s1_l2', 'usr_student_001', 'les_eng_a1_2', 'crs_eng_a1', now);
}

function seedLessonsAndCurriculum() {
  const insertLesson = db.prepare(`
    INSERT INTO lessons (id, course_id, title, summary, order_index, duration_minutes, is_free_preview, modality_flags_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertActivity = db.prepare(`
    INSERT INTO lesson_activities (id, lesson_id, modality, title, content_json, order_index)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertQuiz = db.prepare(`
    INSERT INTO quizzes (id, course_id, lesson_id, title, description, passing_score, is_final_assessment)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertQuestion = db.prepare(`
    INSERT INTO quiz_questions (id, quiz_id, prompt, type, options_json, correct_answer_json, explanation, order_index)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // --- COURSE 1: English A1 ---
  const engA1Lessons = [
    {
      id: 'les_eng_a1_1',
      title: 'Greetings & Warm Introductions',
      summary: 'Learn essential phrases to meet people, say hello, and exchange names politely.',
      activities: [
        {
          modality: 'reading',
          title: 'Morning Meeting at the Global Lounge',
          content: {
            passage: "Hello! My name is Maya. I am from Kyoto, Japan. I live in London now. Nice to meet you! How are you doing today?",
            translation: "¡Hola! Mi nombre es Maya. Soy de Kioto, Japón. Vivo en Londres ahora. ¡Mucho gusto! ¿Cómo estás hoy?",
            vocabulary: [
              { word: "Greetings", meaning: "Words or gestures used when meeting someone" },
              { word: "Pleased to meet you", meaning: "A polite formal phrase upon first introduction" },
              { word: "Native", meaning: "Belonging to a person by birth or location" }
            ],
            questions: [
              { q: "Where does Maya live now?", a: "London" }
            ]
          }
        },
        {
          modality: 'listening',
          title: 'Audio Dialogue: Meeting Alex',
          content: {
            audioScript: "Good morning! Are you Alex from the language exchange group? Yes, that's right! Welcome to London.",
            playbackUrl: "https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg",
            speedOptions: [0.75, 1.0, 1.25],
            transcript: "Speaker A: Good morning! Are you Alex?\nSpeaker B: Yes, that's right! Welcome to London.",
            checkQuestion: "What time of day is the greeting spoken?",
            checkOptions: ["Good morning", "Good evening", "Good night"],
            correctOption: "Good morning"
          }
        },
        {
          modality: 'video',
          title: 'Body Language & Politeness in English',
          content: {
            videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
            summary: "Understand eye contact, firm handshakes, and polite smile cues during English introductions.",
            timestamps: [
              { time: "0:02", note: "Eye contact and natural posture" },
              { time: "0:06", note: "The handshake distance" }
            ]
          }
        },
        {
          modality: 'speaking',
          title: 'Introduce Yourself Aloud',
          content: {
            prompt: "Say: 'Hello! My name is [Your Name], and I am excited to learn English.'",
            targetPhrase: "Hello! My name is Alex, and I am excited to learn English.",
            pronunciationTips: "Ensure clear aspiration on the 'H' in 'Hello' and enunciate 'excited' with three syllables: ex-ci-ted."
          }
        },
        {
          modality: 'writing',
          title: 'Sentence Scramble & Fill-in',
          content: {
            sentenceParts: ["Nice", "to", "meet", "you,", "my", "name", "is", "Alex."],
            fillPrompt: "Complete the sentence: 'Good ________ (morning/bed), how are you?'",
            correctBlank: "morning"
          }
        },
        {
          modality: 'grammar_vocab',
          title: 'Grammar: The Verb "To Be" (am / is / are)',
          content: {
            rule: "Use 'I am', 'You are', 'He/She/It is', 'We/They are' for states of being and identity.",
            examples: [
              { en: "I am a student.", es: "Soy estudiante." },
              { en: "She is friendly.", es: "Ella es amable." },
              { en: "They are here.", es: "Ellos están aquí." }
            ],
            flashcards: [
              { term: "I am", def: "First person singular state of being" },
              { term: "You are", def: "Second person singular and plural" },
              { term: "He/She is", def: "Third person singular" }
            ]
          }
        }
      ]
    },
    {
      id: 'les_eng_a1_2',
      title: 'Ordering at a Cafe',
      summary: 'Order coffee, ask for prices, specify milk preferences, and pay politely.',
      activities: [
        {
          modality: 'reading',
          title: 'At the Corner Bakery & Cafe',
          content: {
            passage: "Can I have a large oat milk latte and a warm croissant, please? How much is that altogether? That will be £4.50.",
            translation: "¿Me da un café con leche de avena grande y un croissant caliente, por favor?",
            vocabulary: [
              { word: "Latte", meaning: "Espresso with steamed milk" },
              { word: "Altogether", meaning: "In total" }
            ]
          }
        },
        {
          modality: 'speaking',
          title: 'Order Your Favorite Beverage',
          content: {
            prompt: "Record yourself saying: 'Could I please have a cappuccino and the bill?'",
            targetPhrase: "Could I please have a cappuccino and the bill?",
            pronunciationTips: "Soft 'c' in cappuccino, stress on the double 'p'."
          }
        },
        {
          modality: 'grammar_vocab',
          title: 'Polite Requests with "Could I" & "May I"',
          content: {
            rule: "'Could I have...' is much more polite than 'I want...'",
            examples: [
              { en: "Could I have some water?", es: "¿Podría darme un poco de agua?" },
              { en: "May I see the menu?", es: "¿Puedo ver el menú?" }
            ]
          }
        }
      ]
    },
    {
      id: 'les_eng_a1_3',
      title: 'Daily Routines & Telling Time',
      summary: 'Express your daily schedule, morning routines, and understand clock times.',
      activities: [
        {
          modality: 'reading',
          title: 'A Typical Tuesday for David',
          content: {
            passage: "David wakes up at 7:00 AM. He prepares breakfast, drinks black tea, and catches the bus at 8:15 AM to reach work by 9:00 AM.",
            translation: "David se despierta a las 7:00 AM. Prepara el desayuno...",
            vocabulary: [{ word: "Routine", meaning: "A regular sequence of actions" }]
          }
        },
        {
          modality: 'writing',
          title: 'Describe Your Morning',
          content: {
            fillPrompt: "I wake up at ______ and have breakfast.",
            correctBlank: "7 AM"
          }
        }
      ]
    },
    {
      id: 'les_eng_a1_4',
      title: 'Asking for Directions in the City',
      summary: 'Navigate streets, find metro stations, and understand left, right, and straight ahead.',
      activities: [
        {
          modality: 'reading',
          title: 'Finding the Central Library',
          content: {
            passage: "Excuse me, where is the nearest underground station? Go straight for two blocks, then turn left at the traffic light.",
            translation: "Disculpe, ¿dónde está la estación de metro más cercana? Vaya recto...",
            vocabulary: [{ word: "Traffic light", meaning: "Signaling device at road intersections" }]
          }
        },
        {
          modality: 'listening',
          title: 'Listening to Navigation Instructions',
          content: {
            audioScript: "Turn right at the post office, walk past the pharmacy, and the museum will be on your right.",
            transcript: "Turn right at the post office, walk past the pharmacy, and the museum will be on your right.",
            checkQuestion: "On which side is the museum?",
            checkOptions: ["On your right", "On your left", "Behind the park"],
            correctOption: "On your right"
          }
        }
      ]
    },
    {
      id: 'les_eng_a1_5',
      title: 'Family & Living Spaces',
      summary: 'Describe members of your family, your hometown, and your living environment.',
      activities: [
        {
          modality: 'reading',
          title: 'My Apartment in Manchester',
          content: {
            passage: "I share a bright two-bedroom flat with my brother. We have a cozy kitchen and a small balcony with flowers.",
            translation: "Comparto un luminoso piso de dos habitaciones con mi hermano...",
            vocabulary: [{ word: "Flat / Apartment", meaning: "A suite of rooms forming one residence" }]
          }
        },
        {
          modality: 'grammar_vocab',
          title: 'Possessive Adjectives (my, your, his, her, our, their)',
          content: {
            rule: "Possessive adjectives show ownership before nouns.",
            examples: [
              { en: "This is my home.", es: "Esta es mi casa." },
              { en: "Their apartment is modern.", es: "Su departamento es moderno." }
            ]
          }
        }
      ]
    }
  ];

  for (let i = 0; i < engA1Lessons.length; i++) {
    const l = engA1Lessons[i];
    insertLesson.run(
      l.id,
      'crs_eng_a1',
      l.title,
      l.summary,
      i + 1,
      15,
      i === 0 ? 1 : 0,
      JSON.stringify(['reading', 'listening', 'speaking', 'writing', 'grammar_vocab'])
    );

    for (let j = 0; j < l.activities.length; j++) {
      const act = l.activities[j];
      insertActivity.run(
        `act_eng_a1_${i + 1}_${j + 1}`,
        l.id,
        act.modality,
        act.title,
        JSON.stringify(act.content),
        j + 1
      );
    }
  }

  // Quiz for English A1 (Final Course Assessment)
  insertQuiz.run(
    'quiz_eng_a1_final',
    'crs_eng_a1',
    null,
    'English A1 — Comprehensive Final Examination',
    'Evaluate your comprehension of greetings, cafe transactions, directions, and basic grammar.',
    70,
    1
  );

  const engA1Questions = [
    {
      prompt: "Which response is most polite when introduced to someone for the first time?",
      type: "single_choice",
      options: ["Nice to meet you.", "Whatever.", "Give me that.", "See you."],
      correct: "Nice to meet you.",
      explanation: "'Nice to meet you' or 'Pleased to meet you' is standard polite English."
    },
    {
      prompt: "Complete the sentence: 'David ________ a software engineer in London.'",
      type: "single_choice",
      options: ["is", "am", "are", "be"],
      correct: "is",
      explanation: "Third person singular 'David' requires 'is'."
    },
    {
      prompt: "How do you politely order coffee in English?",
      type: "single_choice",
      options: ["Could I please have a black coffee?", "Give coffee now.", "I take drink.", "Coffee fast."],
      correct: "Could I please have a black coffee?",
      explanation: "'Could I please have...' is standard polite modal formulation."
    },
    {
      prompt: "What is the opposite of 'turn left'?",
      type: "single_choice",
      options: ["turn right", "turn back", "go straight", "stop now"],
      correct: "turn right",
      explanation: "'Right' is the opposite directional term to 'left'."
    },
    {
      prompt: "Which sentence uses the correct possessive adjective?",
      type: "single_choice",
      options: ["This is her car.", "This is she car.", "This is hers car.", "This is him car."],
      correct: "This is her car.",
      explanation: "'Her' is the correct possessive adjective preceding the noun 'car'."
    }
  ];

  for (let q = 0; q < engA1Questions.length; q++) {
    const item = engA1Questions[q];
    insertQuestion.run(
      `q_eng_a1_${q + 1}`,
      'quiz_eng_a1_final',
      item.prompt,
      item.type,
      JSON.stringify(item.options),
      JSON.stringify(item.correct),
      item.explanation,
      q + 1
    );
  }

  // --- SEED OTHER COURSES (English B1, Spanish A2, French A1, German B1) ---
  const otherCourses = [
    {
      courseId: 'crs_eng_b1',
      lessons: [
        { id: 'les_eng_b1_1', title: 'Leading & Moderating Corporate Standups', summary: 'Structured agendas, handling speaking turns, and concise blocker updates.' },
        { id: 'les_eng_b1_2', title: 'Executive Email Etiquette & Persuasive Proposals', summary: 'Structuring diplomatic emails, action items, and executive summaries.' },
        { id: 'les_eng_b1_3', title: 'Presenting Data, KPIs, and Growth Metrics', summary: 'Verbalizing trends: surging, plateauing, volatility, and forecasts.' },
        { id: 'les_eng_b1_4', title: 'Negotiating Timelines & Professional Disagreements', summary: 'De-escalation tactics, conditional offers, and polite pushbacks.' },
        { id: 'les_eng_b1_5', title: 'Cross-Border Collaboration & Cultural Nuance', summary: 'Navigating high-context vs low-context international team norms.' }
      ],
      quizQuestions: [
        { prompt: "Which phrase politely introduces a disagreement in a business meeting?", options: ["I see your point, but have we considered...", "You are totally wrong.", "Be quiet.", "Never do that."], correct: "I see your point, but have we considered...", explanation: "Diplomatic framing softens constructive disagreement." },
        { prompt: "Which verb describes a sharp, sudden increase in sales metrics?", options: ["Surged", "Drifted", "Stagnated", "Wavered"], correct: "Surged", explanation: "'Surge' indicates rapid upward movement." }
      ]
    },
    {
      courseId: 'crs_esp_a2',
      lessons: [
        { id: 'les_esp_a2_1', title: 'En el Restaurante Tradicional', summary: 'Pedir platos típicos, consultar alérgenos y solicitar la cuenta.' },
        { id: 'les_esp_a2_2', title: 'Viajes y Estación de Tren', summary: 'Comprar billetes de cercanías, horarios y cambios de andén.' },
        { id: 'les_esp_a2_3', title: 'Planes de Fin de Semana y Tiempo Libre', summary: 'Uso de ir a + infinitivo para proponer salidas con amigos.' },
        { id: 'les_esp_a2_4', title: 'De Compras en el Mercado Local', summary: 'Preguntar precios, regatear amablemente y peso de productos.' },
        { id: 'les_esp_a2_5', title: 'Describiendo la Ciudad y el Barrio', summary: 'Comparativos: más... que, menos... que y adjetivos urbanos.' }
      ],
      quizQuestions: [
        { prompt: "¿Cómo se pide la cuenta educadamente al camarero en España?", options: ["La cuenta, por favor.", "Dame dinero.", "Quiero pagar ya.", "Trae la factura."], correct: "La cuenta, por favor.", explanation: "'La cuenta, por favor' es la fórmula habitual y educada." },
        { prompt: "¿Qué tiempo verbal se utiliza comúnmente para acciones completadas en el pasado?", options: ["Pretérito indefinido", "Presente de subjuntivo", "Futuro simple", "Imperativo"], correct: "Pretérito indefinido", explanation: "El pretérito indefinido indica acciones puntuales concluidas." }
      ]
    },
    {
      courseId: 'crs_fra_a1',
      lessons: [
        { id: 'les_fra_a1_1', title: 'Salutations et Formules de Politesse', summary: 'Bonjour, enchanté, s’il vous plaît et vouvoiement.' },
        { id: 'les_fra_a1_2', title: 'Au Café Parisien', summary: 'Commander un café crème, un croissant et de l’eau minérale.' },
        { id: 'les_fra_a1_3', title: 'Présenter sa Famille et ses Amis', summary: 'Mon père, ma sœur, voici mon collègue de travail.' },
        { id: 'les_fra_a1_4', title: 'Les Jours de la Semaine et les Horaires', summary: 'Planifier des rendez-vous simples et comprendre l’heure.' },
        { id: 'les_fra_a1_5', title: 'Se Repérer dans Paris', summary: 'À droite, à gauche, tout droit et la station de métro.' }
      ],
      quizQuestions: [
        { prompt: "Quelle est la salutation appropriée le matin auprès d'un inconnu ?", options: ["Bonjour monsieur", "Salut mec", "Dors bien", "À plus"], correct: "Bonjour monsieur", explanation: "'Bonjour monsieur' exprime le respect et la politesse." },
        { prompt: "Comment dit-on 'Thank you very much' en français ?", options: ["Merci beaucoup", "De rien", "S'il vous plaît", "Au revoir"], correct: "Merci beaucoup", explanation: "'Merci beaucoup' signifie 'Thank you very much'." }
      ]
    },
    {
      courseId: 'crs_deu_b1',
      lessons: [
        { id: 'les_deu_b1_1', title: 'Das Vorstellungsgespräch & Lebenslauf', summary: 'Berufliche Qualifikationen und Stärken überzeugend präsentieren.' },
        { id: 'les_deu_b1_2', title: 'Kommunikation am Arbeitsplatz & E-Mails', summary: 'Sehr geehrte Damen und Herren, Fristen und Aufgabenabstimmung.' },
        { id: 'les_deu_b1_3', title: 'Behörden & Bürgeramt in Deutschland', summary: 'Wohnsitzanmeldung, Formulare und amtliche Begrifflichkeiten.' },
        { id: 'les_deu_b1_4', title: 'Projektmeetings & Technische Diskussionen', summary: 'Sachliche Argumentation und Feedbackkultur im Team.' },
        { id: 'les_deu_b1_5', title: 'Wohnungssuche & Mietvertrag', summary: 'Kaltmiete, Nebenkosten und Übergabeprotokoll verstehen.' }
      ],
      quizQuestions: [
        { prompt: "Welche Anrede ist in einer formellen geschäftlichen E-Mail standard?", options: ["Sehr geehrte Damen und Herren,", "Hallo zusammen!", "Moin Moin,", "Liebe Leute,"], correct: "Sehr geehrte Damen und Herren,", explanation: "'Sehr geehrte Damen und Herren' ist die formelle Standardanrede im deutschen Schriftverkehr." },
        { prompt: "Welche Konjunktion leitet einen Kausalsatz mit Verb am Ende ein?", options: ["weil", "denn", "aber", "und"], correct: "weil", explanation: "'weil' ist eine unterordnende Konjunktion und verlangt das finite Verb am Satzende." }
      ]
    }
  ];

  for (const c of otherCourses) {
    for (let i = 0; i < c.lessons.length; i++) {
      const l = c.lessons[i];
      insertLesson.run(
        l.id,
        c.courseId,
        l.title,
        l.summary,
        i + 1,
        15,
        i === 0 ? 1 : 0,
        JSON.stringify(['reading', 'listening', 'speaking', 'writing', 'grammar_vocab'])
      );

      // Create rich activities for each lesson
      insertActivity.run(
        `act_${l.id}_read`,
        l.id,
        'reading',
        `Reading Comprehension: ${l.title}`,
        JSON.stringify({
          passage: `Professional dialogue and textual analysis for ${l.title}. Learn specific terminology and conversational patterns in this guided lesson module.`,
          translation: `Guía y diálogo profesional para ${l.title}.`,
          vocabulary: [
            { word: "Competence", meaning: "The ability to do something successfully or efficiently" },
            { word: "Objective", meaning: "A goal or targeted result" }
          ]
        }),
        1
      );

      insertActivity.run(
        `act_${l.id}_listen`,
        l.id,
        'listening',
        `Listening Practice: ${l.title}`,
        JSON.stringify({
          audioScript: `This is the native pronunciation track for ${l.title}. Listen carefully to intonation and cadence.`,
          transcript: `Speaker: Welcome to this listening session for ${l.title}. Let's focus on clear pronunciation and fluid delivery.`,
          checkQuestion: "What is the primary topic of the audio clip?",
          checkOptions: [l.title, "Weather forecast", "Shopping list"],
          correctOption: l.title
        }),
        2
      );

      insertActivity.run(
        `act_${l.id}_speak`,
        l.id,
        'speaking',
        `Oral Fluency Drill: ${l.title}`,
        JSON.stringify({
          prompt: `Record yourself practicing the core phrase for ${l.title}.`,
          targetPhrase: `I am developing my professional language skills in ${l.title}.`,
          pronunciationTips: "Speak clearly at a moderate pace, articulating each consonant cluster."
        }),
        3
      );

      insertActivity.run(
        `act_${l.id}_write`,
        l.id,
        'writing',
        `Writing Exercise: ${l.title}`,
        JSON.stringify({
          fillPrompt: `Write a short response related to ${l.title}.`,
          correctBlank: "language"
        }),
        4
      );

      insertActivity.run(
        `act_${l.id}_gv`,
        l.id,
        'grammar_vocab',
        `Grammar & Vocabulary Focus: ${l.title}`,
        JSON.stringify({
          rule: "Consistent application of grammatical structures and vocabulary acquisition.",
          examples: [
            { en: "Key expression used in context.", es: "Expresión clave utilizada en contexto." }
          ]
        }),
        5
      );
    }

    // Final exam for the course
    const quizId = `quiz_${c.courseId}_final`;
    insertQuiz.run(
      quizId,
      c.courseId,
      null,
      `${c.courseId.toUpperCase()} Final Certification Exam`,
      `Final assessment to prove CEFR mastery and unlock your official verification certificate.`,
      70,
      1
    );

    for (let q = 0; q < c.quizQuestions.length; q++) {
      const qData = c.quizQuestions[q];
      insertQuestion.run(
        `q_${c.courseId}_${q + 1}`,
        quizId,
        qData.prompt,
        'single_choice',
        JSON.stringify(qData.options),
        JSON.stringify(qData.correct),
        qData.explanation,
        q + 1
      );
    }
  }
}

function seedLiveClasses() {
  const count = (db.prepare('SELECT count(*) as count FROM live_classes').get() as { count: number }).count;
  if (count > 0) return;

  const now = new Date();
  const liveNow = new Date(now.getTime() - 10 * 60000).toISOString(); // Started 10 min ago
  const inTwoHours = new Date(now.getTime() + 2 * 3600000).toISOString();
  const tomorrow = new Date(now.getTime() + 24 * 3600000).toISOString();

  const insertClass = db.prepare(`
    INSERT INTO live_classes (
      id, title, description, course_id, lesson_id, instructor_id, instructor_name,
      scheduled_at, duration_minutes, max_capacity, status, room_name, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertClass.run(
    'cls_spanish_cafe',
    'Spanish A2 Conversational Cafe — Live Speaking Circle',
    'Interactive small-group Spanish conversation practice. Focus on ordering meals, weekend plans, and real-time pronunciation drills with your instructor.',
    'crs_esp_a2',
    'les_esp_a2_1',
    'usr_admin_001',
    'Prof. Maria Hernandez (Admin)',
    liveNow,
    45,
    15,
    'live',
    'room_spanish_conv_cafe',
    now.toISOString()
  );

  insertClass.run(
    'cls_english_exec',
    'English B1 Executive Presentations & Q&A Workshop',
    'Practice articulating blockers, presenting quarterly KPIs to leadership, and negotiating timelines under pressure with feedback.',
    'crs_eng_b1',
    'les_eng_b1_1',
    'usr_admin_001',
    'Prof. Alistair Vance (Admin)',
    inTwoHours,
    60,
    25,
    'scheduled',
    'room_english_exec_workshop',
    now.toISOString()
  );

  insertClass.run(
    'cls_german_work',
    'German B1 Workplace Communication & Standup Protocol',
    'Master German corporate etiquette, formal email follow-ups, and collaborating in engineering and business teams.',
    'crs_deu_b1',
    'les_deu_b1_1',
    'usr_admin_001',
    'Prof. Klaus Weber (Admin)',
    tomorrow,
    45,
    20,
    'scheduled',
    'room_german_workplace',
    now.toISOString()
  );

  // Register demo student for Spanish cafe and English executive
  const insertReg = db.prepare(`
    INSERT INTO live_class_registrations (id, class_id, user_id, registered_at)
    VALUES (?, ?, ?, ?)
  `);
  insertReg.run('reg_demo_1', 'cls_spanish_cafe', 'usr_student_001', now.toISOString());
  insertReg.run('reg_demo_2', 'cls_english_exec', 'usr_student_001', now.toISOString());
}

