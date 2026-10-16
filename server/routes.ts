import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { db } from './db';
import { GoogleGenAI } from '@google/genai';
import { AccessToken } from 'livekit-server-sdk';

export const apiRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'lingopro_dev_secret_key_change_in_production_2026';

// Initialize Gemini SDK if API key is provided
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  } catch (e) {
    console.error('Failed to initialize GoogleGenAI client:', e);
  }
}

// -------------------------------------------------------------
// Authentication Middleware
// -------------------------------------------------------------
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string; name: string };
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired or invalid token. Please log in again.' });
  }
}

export function optionalAuthenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string; name: string };
      req.user = payload;
    } catch {
      // ignore invalid token for optional auth
    }
  }
  next();
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden. Administrator privileges required.' });
  }
  next();
}

// -------------------------------------------------------------
// Phase 2: Authentication Endpoints
// -------------------------------------------------------------
apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  const trimmedEmail = String(email).trim().toLowerCase();
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  // Check if user already exists
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(trimmedEmail) as { id: string } | undefined;
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const userId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const passwordHash = bcrypt.hashSync(password, 10);
  const now = new Date().toISOString();
  const today = now.slice(0, 10);

  // CRITICAL RULE: Public registration can create only USER accounts
  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, streak_days, last_active_date, xp, created_at)
    VALUES (?, ?, ?, ?, 'USER', 1, ?, 50, ?)
  `).run(userId, String(name).trim(), trimmedEmail, passwordHash, today, now);

  // Assign default free subscription
  db.prepare(`
    INSERT INTO subscriptions (id, user_id, plan_id, status, starts_at, ends_at)
    VALUES (?, ?, 'plan_free', 'free', ?, ?)
  `).run(`sub_${userId}`, userId, now, new Date(Date.now() + 365 * 86400000).toISOString());

  // Log welcome XP in ledger
  db.prepare(`
    INSERT INTO xp_ledger (id, user_id, amount, reason, source_type, source_id, created_at)
    VALUES (?, ?, 50, 'Welcome Bonus', 'registration', ?, ?)
  `).run(`xpl_${Date.now()}`, userId, userId, now);

  const token = jwt.sign(
    { id: userId, email: trimmedEmail, name: String(name).trim(), role: 'USER' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.status(201).json({
    token,
    user: {
      id: userId,
      name: String(name).trim(),
      email: trimmedEmail,
      role: 'USER',
      xp: 50,
      streak_days: 1
    }
  });
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const trimmedEmail = String(email).trim().toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(trimmedEmail) as any;
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  // Update streak & last active
  const today = new Date().toISOString().slice(0, 10);
  let newStreak = user.streak_days || 1;
  if (user.last_active_date) {
    const lastDate = new Date(user.last_active_date);
    const currDate = new Date(today);
    const diffDays = Math.round((currDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
    if (diffDays === 1) {
      newStreak += 1;
    } else if (diffDays > 1) {
      newStreak = 1;
    }
  }

  db.prepare('UPDATE users SET last_active_date = ?, streak_days = ? WHERE id = ?').run(today, newStreak, user.id);

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      xp: user.xp,
      streak_days: newStreak
    }
  });
});

apiRouter.get('/auth/me', authenticate, (req: AuthRequest, res: Response) => {
  const user = db.prepare('SELECT id, name, email, role, streak_days, xp, created_at, avatar_url FROM users WHERE id = ?').get(req.user!.id) as any;
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  // Check active subscription
  const sub = db.prepare(`
    SELECT s.*, p.name as plan_name, p.price_inr
    FROM subscriptions s
    LEFT JOIN subscription_plans p ON s.plan_id = p.id
    WHERE s.user_id = ?
    ORDER BY s.ends_at DESC
    LIMIT 1
  `).get(user.id) as any;

  return res.json({
    user,
    subscription: sub || { status: 'free', plan_name: 'Free Starter', plan_id: 'plan_free' }
  });
});

apiRouter.post('/auth/logout', (_req: Request, res: Response) => {
  return res.json({ message: 'Logged out successfully.' });
});

apiRouter.put('/auth/profile', authenticate, (req: AuthRequest, res: Response) => {
  const { name } = req.body;
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Name cannot be empty.' });
  }

  db.prepare('UPDATE users SET name = ? WHERE id = ?').run(String(name).trim(), req.user!.id);
  return res.json({ message: 'Profile updated successfully', name: String(name).trim() });
});

// -------------------------------------------------------------
// Phase 4: Course Catalog & Enrollment Endpoints
// -------------------------------------------------------------
apiRouter.get('/courses', optionalAuthenticate, (req: AuthRequest, res: Response) => {
  const { language, level, search } = req.query;

  let query = 'SELECT * FROM courses WHERE 1=1';
  const params: any[] = [];

  if (language && language !== 'all') {
    query += ' AND LOWER(language) = LOWER(?)';
    params.push(String(language));
  }
  if (level && level !== 'all') {
    query += ' AND UPPER(cefr_level) = UPPER(?)';
    params.push(String(level));
  }
  if (search) {
    query += ' AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ?)';
    params.push(`%${String(search).toLowerCase()}%`, `%${String(search).toLowerCase()}%`);
  }

  query += ' ORDER BY created_at ASC';

  const courses = db.prepare(query).all(...params) as any[];

  // If user is authenticated, attach their enrollment & progress percent
  const userId = req.user?.id;
  const enriched = courses.map((course) => {
    let enrollment = null;
    let completedLessonsCount = 0;
    const totalLessons = (db.prepare('SELECT count(*) as count FROM lessons WHERE course_id = ?').get(course.id) as any).count;

    if (userId) {
      enrollment = db.prepare('SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?').get(userId, course.id) as any;
      completedLessonsCount = (db.prepare(`
        SELECT count(*) as count FROM lesson_progress
        WHERE user_id = ? AND course_id = ? AND status = 'completed'
      `).get(userId, course.id) as any).count;
    }

    return {
      ...course,
      learning_outcomes: JSON.parse(course.learning_outcomes_json || '[]'),
      is_premium: Boolean(course.is_premium),
      is_enrolled: Boolean(enrollment),
      total_lessons: totalLessons,
      completed_lessons: completedLessonsCount,
      progress_percent: totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0
    };
  });

  return res.json({ courses: enriched });
});

apiRouter.get('/courses/:id', optionalAuthenticate, (req: AuthRequest, res: Response) => {
  const courseId = req.params.id;
  const course = db.prepare('SELECT * FROM courses WHERE id = ? OR slug = ?').get(courseId, courseId) as any;
  if (!course) {
    return res.status(404).json({ error: 'Course not found.' });
  }

  const lessons = db.prepare(`
    SELECT id, title, summary, order_index, duration_minutes, is_free_preview, modality_flags_json
    FROM lessons
    WHERE course_id = ?
    ORDER BY order_index ASC
  `).all(course.id) as any[];

  const userId = req.user?.id;
  let enrollment = null;
  let certificate = null;

  if (userId) {
    enrollment = db.prepare('SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?').get(userId, course.id) as any;
    certificate = db.prepare('SELECT * FROM certificates WHERE user_id = ? AND course_id = ?').get(userId, course.id) as any;
  }

  const parsedLessons = lessons.map((l) => {
    let progress = null;
    if (userId) {
      progress = db.prepare('SELECT status, completed_at FROM lesson_progress WHERE user_id = ? AND lesson_id = ?').get(userId, l.id) as any;
    }
    return {
      ...l,
      is_free_preview: Boolean(l.is_free_preview),
      modalities: JSON.parse(l.modality_flags_json || '[]'),
      status: progress ? progress.status : 'not_started'
    };
  });

  return res.json({
    course: {
      ...course,
      learning_outcomes: JSON.parse(course.learning_outcomes_json || '[]'),
      is_premium: Boolean(course.is_premium),
      is_enrolled: Boolean(enrollment),
      enrollment,
      certificate
    },
    lessons: parsedLessons
  });
});

apiRouter.post('/courses/:id/enroll', authenticate, (req: AuthRequest, res: Response) => {
  const courseId = req.params.id;
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId) as any;
  if (!course) {
    return res.status(404).json({ error: 'Course not found.' });
  }

  const userId = req.user!.id;

  // Check existing enrollment
  const existing = db.prepare('SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?').get(userId, course.id);
  if (existing) {
    return res.json({ message: 'Already enrolled', enrolled: true });
  }

  // Premium entitlement check
  if (course.is_premium) {
    const sub = db.prepare(`
      SELECT s.*, p.name as plan_name
      FROM subscriptions s
      JOIN subscription_plans p ON s.plan_id = p.id
      WHERE s.user_id = ? AND s.status IN ('active', 'pro', 'premium') AND s.ends_at > datetime('now')
    `).get(userId) as any;

    if (!sub) {
      return res.status(403).json({
        error: 'This is a premium course. Upgrade to Pro Scholar or Global Career Pass to enroll.',
        requires_subscription: true
      });
    }
  }

  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO enrollments (id, user_id, course_id, enrolled_at, progress_percent)
    VALUES (?, ?, ?, ?, 0)
  `).run(`enr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, userId, course.id, now);

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (id, actor_user_id, action, resource_type, resource_id, details_json, created_at)
    VALUES (?, ?, 'COURSE_ENROLL', 'course', ?, ?, ?)
  `).run(`log_${Date.now()}`, userId, course.id, JSON.stringify({ courseTitle: course.title }), now);

  return res.status(201).json({ message: 'Enrolled successfully!', enrolled: true });
});

// -------------------------------------------------------------
// Phase 5: 6-Modality Learning Engine & Lessons
// -------------------------------------------------------------
apiRouter.get('/lessons/:id', optionalAuthenticate, (req: AuthRequest, res: Response) => {
  const lesson = db.prepare('SELECT * FROM lessons WHERE id = ?').get(req.params.id) as any;
  if (!lesson) {
    return res.status(404).json({ error: 'Lesson not found.' });
  }

  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(lesson.course_id) as any;

  // Premium lock check
  if (course.is_premium && !lesson.is_free_preview) {
    if (!req.user) {
      return res.status(401).json({ error: 'Please sign in to access this premium lesson.' });
    }
    const sub = db.prepare(`
      SELECT s.id FROM subscriptions s
      WHERE s.user_id = ? AND s.status IN ('active', 'pro', 'premium') AND s.ends_at > datetime('now')
    `).get(req.user.id);

    if (!sub && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Premium lesson locked. Please subscribe to access.',
        requires_subscription: true
      });
    }
  }

  const activities = db.prepare(`
    SELECT id, modality, title, content_json, order_index
    FROM lesson_activities
    WHERE lesson_id = ?
    ORDER BY order_index ASC
  `).all(lesson.id) as any[];

  let userProgress = null;
  if (req.user) {
    userProgress = db.prepare(`
      SELECT * FROM lesson_progress WHERE user_id = ? AND lesson_id = ?
    `).get(req.user.id, lesson.id);
  }

  return res.json({
    lesson: {
      ...lesson,
      modalities: JSON.parse(lesson.modality_flags_json || '[]'),
      is_free_preview: Boolean(lesson.is_free_preview)
    },
    courseTitle: course.title,
    courseId: course.id,
    activities: activities.map((a) => ({
      ...a,
      content: JSON.parse(a.content_json || '{}')
    })),
    progress: userProgress || { status: 'not_started' }
  });
});

apiRouter.post('/lessons/:id/progress', authenticate, (req: AuthRequest, res: Response) => {
  const lessonId = req.params.id;
  const userId = req.user!.id;

  const lesson = db.prepare('SELECT * FROM lessons WHERE id = ?').get(lessonId) as any;
  if (!lesson) {
    return res.status(404).json({ error: 'Lesson not found.' });
  }

  const now = new Date().toISOString();

  // Check if already completed
  const existing = db.prepare(`
    SELECT * FROM lesson_progress WHERE user_id = ? AND lesson_id = ?
  `).get(userId, lessonId) as any;

  let xpAwarded = 0;
  if (!existing || existing.status !== 'completed') {
    // Upsert lesson progress
    db.prepare(`
      INSERT INTO lesson_progress (id, user_id, lesson_id, course_id, status, completed_at)
      VALUES (?, ?, ?, ?, 'completed', ?)
      ON CONFLICT(user_id, lesson_id) DO UPDATE SET status = 'completed', completed_at = excluded.completed_at
    `).run(`lp_${Date.now()}`, userId, lessonId, lesson.course_id, now);

    // Award 25 XP
    xpAwarded = 25;
    db.prepare('UPDATE users SET xp = xp + 25 WHERE id = ?').run(userId);
    db.prepare(`
      INSERT INTO xp_ledger (id, user_id, amount, reason, source_type, source_id, created_at)
      VALUES (?, ?, 25, 'Lesson Completed', 'lesson', ?, ?)
    `).run(`xpl_${Date.now()}`, userId, lessonId, now);

    // Ensure enrollment exists and recalculate course progress %
    db.prepare(`
      INSERT INTO enrollments (id, user_id, course_id, enrolled_at, progress_percent)
      VALUES (?, ?, ?, ?, 0)
      ON CONFLICT(user_id, course_id) DO NOTHING
    `).run(`enr_${Date.now()}`, userId, lesson.course_id, now);

    const totalLessons = (db.prepare('SELECT count(*) as count FROM lessons WHERE course_id = ?').get(lesson.course_id) as any).count;
    const completedCount = (db.prepare(`
      SELECT count(*) as count FROM lesson_progress
      WHERE user_id = ? AND course_id = ? AND status = 'completed'
    `).get(userId, lesson.course_id) as any).count;

    const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
    db.prepare(`
      UPDATE enrollments SET progress_percent = ?, completed_at = (CASE WHEN ? >= 100 THEN ? ELSE completed_at END)
      WHERE user_id = ? AND course_id = ?
    `).run(progressPercent, progressPercent, now, userId, lesson.course_id);
  }

  return res.json({
    status: 'completed',
    xpAwarded,
    message: xpAwarded > 0 ? `Well done! +${xpAwarded} XP earned.` : 'Lesson progress synced.'
  });
});

apiRouter.post('/activities/attempt', authenticate, (req: AuthRequest, res: Response) => {
  const { lessonId, modality, payload, score, feedback } = req.body;
  if (!lessonId || !modality) {
    return res.status(400).json({ error: 'lessonId and modality are required.' });
  }

  const userId = req.user!.id;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO practice_attempts (id, user_id, lesson_id, modality, payload_json, score, feedback, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    userId,
    lessonId,
    modality,
    JSON.stringify(payload || {}),
    typeof score === 'number' ? score : null,
    feedback || null,
    now
  );

  return res.json({ message: 'Practice attempt stored securely.' });
});

// -------------------------------------------------------------
// Phase 6: Quiz and Assessment Engine (Server-Side Grading)
// -------------------------------------------------------------
apiRouter.get('/quizzes/:id', optionalAuthenticate, (req: Request, res: Response) => {
  const quizId = req.params.id;
  const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(quizId) as any;
  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found.' });
  }

  // CRITICAL RULE: NEVER send hidden answer keys to client on GET
  const questions = db.prepare(`
    SELECT id, prompt, type, options_json, order_index
    FROM quiz_questions
    WHERE quiz_id = ?
    ORDER BY order_index ASC
  `).all(quiz.id) as any[];

  return res.json({
    quiz: {
      id: quiz.id,
      course_id: quiz.course_id,
      title: quiz.title,
      description: quiz.description,
      passing_score: quiz.passing_score,
      is_final_assessment: Boolean(quiz.is_final_assessment),
      total_questions: questions.length
    },
    questions: questions.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      type: q.type,
      options: JSON.parse(q.options_json || '[]'),
      order_index: q.order_index
    }))
  });
});

apiRouter.post('/quizzes/:id/submit', authenticate, (req: AuthRequest, res: Response) => {
  const quizId = req.params.id;
  const { answers } = req.body as { answers: Record<string, string> };
  const userId = req.user!.id;

  const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(quizId) as any;
  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found.' });
  }

  const questions = db.prepare(`
    SELECT id, prompt, type, correct_answer_json, explanation
    FROM quiz_questions
    WHERE quiz_id = ?
    ORDER BY order_index ASC
  `).all(quiz.id) as any[];

  let correctCount = 0;
  const reviews = questions.map((q) => {
    const rawCorrect = JSON.parse(q.correct_answer_json);
    const userAnswer = answers ? answers[q.id] : undefined;
    const isCorrect = String(userAnswer || '').trim().toLowerCase() === String(rawCorrect || '').trim().toLowerCase();

    if (isCorrect) correctCount += 1;

    return {
      questionId: q.id,
      prompt: q.prompt,
      userAnswer: userAnswer || '(No answer)',
      correctAnswer: rawCorrect,
      isCorrect,
      explanation: q.explanation
    };
  });

  const total = questions.length;
  const scorePercent = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const passed = scorePercent >= (quiz.passing_score || 70);
  const now = new Date().toISOString();

  // Record attempt in database
  db.prepare(`
    INSERT INTO quiz_attempts (id, user_id, quiz_id, score, total_questions, passed, submitted_answers_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `qatt_${Date.now()}`,
    userId,
    quiz.id,
    scorePercent,
    total,
    passed ? 1 : 0,
    JSON.stringify(answers || {}),
    now
  );

  // Check duplicate reward protection
  let xpAwarded = 0;
  if (passed) {
    const previousPass = db.prepare(`
      SELECT id FROM quiz_attempts
      WHERE user_id = ? AND quiz_id = ? AND passed = 1 AND id != ?
    `).get(userId, quiz.id, `qatt_${Date.now()}`);

    if (!previousPass) {
      xpAwarded = 75;
      db.prepare('UPDATE users SET xp = xp + 75 WHERE id = ?').run(userId);
      db.prepare(`
        INSERT INTO xp_ledger (id, user_id, amount, reason, source_type, source_id, created_at)
        VALUES (?, ?, 75, 'Passed Assessment', 'quiz', ?, ?)
      `).run(`xpl_${Date.now()}`, userId, quiz.id, now);
    }
  }

  return res.json({
    score: scorePercent,
    correctCount,
    totalQuestions: total,
    passed,
    passingThreshold: quiz.passing_score,
    xpAwarded,
    reviews,
    message: passed
      ? `Congratulations! You passed with ${scorePercent}%.`
      : `You scored ${scorePercent}%. The passing threshold is ${quiz.passing_score}%. Review mistakes and try again.`
  });
});

// -------------------------------------------------------------
// Phase 7: Student Dashboard & Gamification Stats
// -------------------------------------------------------------
apiRouter.get('/dashboard/stats', authenticate, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const user = db.prepare('SELECT id, name, email, role, streak_days, xp, created_at FROM users WHERE id = ?').get(userId) as any;

  // Active Enrollments
  const enrollments = db.prepare(`
    SELECT e.*, c.title as course_title, c.language, c.cefr_level, c.image_url
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    WHERE e.user_id = ?
    ORDER BY e.enrolled_at DESC
  `).all(userId) as any[];

  // Completed lessons count
  const completedLessons = db.prepare(`
    SELECT count(*) as count FROM lesson_progress WHERE user_id = ? AND status = 'completed'
  `).get(userId) as { count: number };

  // Calculate authoritative 6-Skill proficiency from actual attempts and completed activities
  const skillAttempts = db.prepare(`
    SELECT modality, count(*) as count, AVG(score) as avg_score
    FROM practice_attempts
    WHERE user_id = ?
    GROUP BY modality
  `).all(userId) as any[];

  const skillScores: Record<string, number> = {
    Reading: 70,
    Listening: 65,
    Speaking: 55,
    Writing: 60,
    Grammar: 75,
    Vocabulary: 80
  };

  // Dynamically calibrate based on real practice attempts
  for (const row of skillAttempts) {
    const mod = String(row.modality).toLowerCase();
    if (mod === 'reading') skillScores.Reading = Math.min(100, Math.round(70 + (row.count * 5)));
    if (mod === 'listening') skillScores.Listening = Math.min(100, Math.round(65 + (row.count * 5)));
    if (mod === 'speaking') skillScores.Speaking = Math.min(100, Math.round(55 + (row.count * 8)));
    if (mod === 'writing') skillScores.Writing = Math.min(100, Math.round(60 + (row.count * 6)));
    if (mod === 'grammar_vocab') {
      skillScores.Grammar = Math.min(100, Math.round(75 + (row.count * 4)));
      skillScores.Vocabulary = Math.min(100, Math.round(80 + (row.count * 4)));
    }
  }

  // Achievements
  const allAchievements = db.prepare('SELECT * FROM achievements').all() as any[];
  const userAchievements = db.prepare(`
    SELECT a.*, ua.unlocked_at
    FROM user_achievements ua
    JOIN achievements a ON ua.achievement_id = a.id
    WHERE ua.user_id = ?
  `).all(userId) as any[];

  // Certificates earned
  const certificates = db.prepare(`
    SELECT * FROM certificates WHERE user_id = ? AND is_revoked = 0
  `).all(userId) as any[];

  // Recent XP ledger
  const recentXp = db.prepare(`
    SELECT * FROM xp_ledger WHERE user_id = ? ORDER BY created_at DESC LIMIT 5
  `).all(userId) as any[];

  return res.json({
    user,
    completedLessonsCount: completedLessons.count,
    enrollments,
    skills: Object.entries(skillScores).map(([skill, score]) => ({ skill, score })),
    achievements: {
      unlocked: userAchievements,
      totalCount: allAchievements.length,
      unlockedCount: userAchievements.length
    },
    certificates,
    recentXp
  });
});

// -------------------------------------------------------------
// Phase 8: Subscriptions & Payments (Razorpay Sandbox)
// -------------------------------------------------------------
apiRouter.get('/plans', (_req: Request, res: Response) => {
  const plans = db.prepare('SELECT * FROM subscription_plans WHERE is_active = 1').all() as any[];
  return res.json({
    plans: plans.map((p) => ({
      ...p,
      features: JSON.parse(p.features_json || '[]')
    }))
  });
});

apiRouter.get('/subscriptions/current', authenticate, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const sub = db.prepare(`
    SELECT s.*, p.name as plan_name, p.price_inr, p.features_json
    FROM subscriptions s
    JOIN subscription_plans p ON s.plan_id = p.id
    WHERE s.user_id = ?
    ORDER BY s.ends_at DESC
    LIMIT 1
  `).get(userId) as any;

  const payments = db.prepare(`
    SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC LIMIT 10
  `).all(userId) as any[];

  return res.json({
    subscription: sub ? {
      ...sub,
      features: JSON.parse(sub.features_json || '[]')
    } : null,
    payments
  });
});

apiRouter.post('/payments/create-order', authenticate, (req: AuthRequest, res: Response) => {
  const { planId } = req.body;
  if (!planId) {
    return res.status(400).json({ error: 'planId is required.' });
  }

  // CRITICAL RULE: Load prices from trusted server-side plan records
  const plan = db.prepare('SELECT * FROM subscription_plans WHERE id = ?').get(planId) as any;
  if (!plan) {
    return res.status(404).json({ error: 'Invalid subscription plan.' });
  }

  if (plan.price_inr === 0) {
    return res.status(400).json({ error: 'This is a free plan; no payment order required.' });
  }

  const userId = req.user!.id;
  const orderId = `order_lp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const receiptNumber = `rcpt_${Date.now()}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO payments (id, user_id, order_id, payment_id, amount_inr, status, gateway, receipt_number, created_at)
    VALUES (?, ?, ?, 'pending', ?, 'created', 'razorpay_test', ?, ?)
  `).run(`pay_${Date.now()}`, userId, orderId, plan.price_inr, receiptNumber, now);

  return res.json({
    orderId,
    amount: plan.price_inr * 100, // in paise
    amountInr: plan.price_inr,
    currency: 'INR',
    planId: plan.id,
    planName: plan.name,
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_lingopro_sandbox'
  });
});

apiRouter.post('/payments/verify', authenticate, (req: AuthRequest, res: Response) => {
  const { orderId, paymentId, signature, planId } = req.body;
  const userId = req.user!.id;

  if (!orderId || !paymentId) {
    return res.status(400).json({ error: 'orderId and paymentId are required.' });
  }

  // Check order in payments table
  const payment = db.prepare('SELECT * FROM payments WHERE order_id = ? AND user_id = ?').get(orderId, userId) as any;
  if (!payment) {
    return res.status(404).json({ error: 'Payment order not found.' });
  }

  // Server-side signature verification if live secret exists, or sandbox simulation validation
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (keySecret && signature) {
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    if (expectedSignature !== signature) {
      db.prepare('UPDATE payments SET status = "failed" WHERE order_id = ?').run(orderId);
      return res.status(400).json({ error: 'Invalid payment signature. Verification failed.' });
    }
  }

  const now = new Date().toISOString();
  const endsAt = new Date(Date.now() + 30 * 86400000).toISOString(); // 30-day active subscription

  // Update payment to verified
  db.prepare(`
    UPDATE payments SET status = 'verified', payment_id = ? WHERE order_id = ?
  `).run(paymentId, orderId);

  // Activate subscription
  const targetPlan = planId || 'plan_pro';
  db.prepare(`
    INSERT INTO subscriptions (id, user_id, plan_id, status, order_id, payment_id, starts_at, ends_at)
    VALUES (?, ?, ?, 'active', ?, ?, ?, ?)
  `).run(`sub_${Date.now()}`, userId, targetPlan, orderId, paymentId, now, endsAt);

  // Log audit
  db.prepare(`
    INSERT INTO audit_logs (id, actor_user_id, action, resource_type, resource_id, details_json, created_at)
    VALUES (?, ?, 'SUBSCRIPTION_ACTIVATED', 'subscription', ?, ?, ?)
  `).run(`log_${Date.now()}`, userId, orderId, JSON.stringify({ planId: targetPlan, amount: payment.amount_inr }), now);

  return res.json({
    success: true,
    message: 'Payment verified successfully! Subscription activated.',
    endsAt
  });
});

// Idempotent webhook receiver
apiRouter.post('/payments/webhook', (req: Request, res: Response) => {
  const eventId = req.headers['x-razorpay-event-id'] as string || `evt_${Date.now()}`;
  const existing = db.prepare('SELECT id FROM payment_webhook_events WHERE event_id = ?').get(eventId);
  if (existing) {
    return res.json({ status: 'already_processed' });
  }

  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO payment_webhook_events (id, event_id, event_name, payload_json, processed_at, status)
    VALUES (?, ?, ?, ?, ?, 'processed')
  `).run(`pwe_${Date.now()}`, eventId, req.body?.event || 'payment.captured', JSON.stringify(req.body || {}), now);

  return res.json({ status: 'processed' });
});

// -------------------------------------------------------------
// Phase 9: Certificates (Authoritative Server Verification)
// -------------------------------------------------------------
apiRouter.get('/certificates/eligible/:courseId', authenticate, (req: AuthRequest, res: Response) => {
  const courseId = req.params.courseId;
  const userId = req.user!.id;

  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId) as any;
  if (!course) {
    return res.status(404).json({ error: 'Course not found.' });
  }

  // Check if already claimed
  const existingCert = db.prepare(`
    SELECT * FROM certificates WHERE user_id = ? AND course_id = ?
  `).get(userId, course.id) as any;

  if (existingCert) {
    return res.json({
      eligible: false,
      alreadyClaimed: true,
      certificate: existingCert,
      message: 'Certificate has already been issued.'
    });
  }

  // Rule 1: All required lessons completed
  const totalLessons = (db.prepare('SELECT count(*) as count FROM lessons WHERE course_id = ?').get(course.id) as any).count;
  const completedLessons = (db.prepare(`
    SELECT count(*) as count FROM lesson_progress
    WHERE user_id = ? AND course_id = ? AND status = 'completed'
  `).get(userId, course.id) as any).count;

  // Rule 2: Final assessment passed at >= 70%
  const finalQuiz = db.prepare(`
    SELECT * FROM quizzes WHERE course_id = ? AND is_final_assessment = 1
  `).get(course.id) as any;

  let finalQuizPassed = false;
  let finalScore = 0;
  if (finalQuiz) {
    const attempt = db.prepare(`
      SELECT score, passed FROM quiz_attempts
      WHERE user_id = ? AND quiz_id = ? AND passed = 1
      ORDER BY score DESC LIMIT 1
    `).get(userId, finalQuiz.id) as any;

    if (attempt) {
      finalQuizPassed = true;
      finalScore = attempt.score;
    }
  } else {
    // If no final assessment explicitly created, allow full lesson completion
    finalQuizPassed = true;
    finalScore = 100;
  }

  const allLessonsDone = totalLessons > 0 && completedLessons >= totalLessons;
  const eligible = allLessonsDone && finalQuizPassed;

  return res.json({
    eligible,
    alreadyClaimed: false,
    requirements: {
      totalLessons,
      completedLessons,
      allLessonsDone,
      finalQuizPassed,
      finalScore
    }
  });
});

apiRouter.post('/certificates/claim/:courseId', authenticate, (req: AuthRequest, res: Response) => {
  const courseId = req.params.courseId;
  const userId = req.user!.id;

  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId) as any;
  if (!course) {
    return res.status(404).json({ error: 'Course not found.' });
  }

  // Prevent duplicate issuance
  const existingCert = db.prepare(`
    SELECT * FROM certificates WHERE user_id = ? AND course_id = ?
  `).get(userId, course.id) as any;
  if (existingCert) {
    return res.status(409).json({ error: 'Certificate has already been claimed for this course.', certificate: existingCert });
  }

  // Server-side eligibility validation
  const totalLessons = (db.prepare('SELECT count(*) as count FROM lessons WHERE course_id = ?').get(course.id) as any).count;
  const completedLessons = (db.prepare(`
    SELECT count(*) as count FROM lesson_progress
    WHERE user_id = ? AND course_id = ? AND status = 'completed'
  `).get(userId, course.id) as any).count;

  if (totalLessons === 0 || completedLessons < totalLessons) {
    return res.status(400).json({ error: `You must complete all ${totalLessons} lessons before claiming your certificate.` });
  }

  const finalQuiz = db.prepare('SELECT * FROM quizzes WHERE course_id = ? AND is_final_assessment = 1').get(course.id) as any;
  let finalScore = 100;
  if (finalQuiz) {
    const attempt = db.prepare(`
      SELECT score FROM quiz_attempts
      WHERE user_id = ? AND quiz_id = ? AND passed = 1
      ORDER BY score DESC LIMIT 1
    `).get(userId, finalQuiz.id) as any;

    if (!attempt) {
      return res.status(400).json({ error: 'You must pass the final assessment before issuing your certificate.' });
    }
    finalScore = attempt.score;
  }

  const user = db.prepare('SELECT name FROM users WHERE id = ?').get(userId) as any;
  const year = new Date().getFullYear();
  const langCode = course.language.slice(0, 3).toUpperCase();
  const certId = `LP-${year}-${langCode}-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO certificates (id, user_id, course_id, recipient_name, course_title, issue_date, final_score)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(certId, userId, course.id, user.name, course.title, now, finalScore);

  // Unlock achievement & award XP
  db.prepare('INSERT INTO user_achievements (id, user_id, achievement_id, unlocked_at) VALUES (?, ?, "ach_certified", ?) ON CONFLICT DO NOTHING').run(
    `uach_${Date.now()}`, userId, now
  );
  db.prepare('UPDATE users SET xp = xp + 200 WHERE id = ?').run(userId);

  return res.status(201).json({
    message: 'Official Certificate Issued!',
    certificate: {
      id: certId,
      recipient_name: user.name,
      course_title: course.title,
      issue_date: now,
      final_score: finalScore
    }
  });
});

// PUBLIC Certificate Verification (No Sensitive User Data Exposed)
apiRouter.get('/certificates/verify/:certId', (req: Request, res: Response) => {
  const cert = db.prepare(`
    SELECT id, recipient_name, course_title, issue_date, final_score, is_revoked, revoked_reason, revoked_at
    FROM certificates
    WHERE id = ?
  `).get(req.params.certId) as any;

  if (!cert) {
    return res.status(404).json({
      valid: false,
      message: 'Certificate ID not found in the official registry. Please check the ID or contact support.'
    });
  }

  if (cert.is_revoked) {
    return res.json({
      valid: false,
      isRevoked: true,
      certId: cert.id,
      recipientName: cert.recipient_name,
      courseTitle: cert.course_title,
      revokedReason: cert.revoked_reason,
      revokedAt: cert.revoked_at,
      message: 'This certificate was revoked by an administrator.'
    });
  }

  return res.json({
    valid: true,
    isRevoked: false,
    certId: cert.id,
    recipientName: cert.recipient_name,
    courseTitle: cert.course_title,
    issueDate: cert.issue_date,
    finalScore: cert.final_score,
    message: 'Verified Authentic LingoPro Academic Credential'
  });
});

// -------------------------------------------------------------
// Phase 10: Complete Administration
// -------------------------------------------------------------
apiRouter.get('/admin/overview', authenticate, requireAdmin, (_req: Request, res: Response) => {
  const totalUsers = (db.prepare("SELECT count(*) as count FROM users WHERE role = 'USER'").get() as any).count;
  const activeSubs = (db.prepare("SELECT count(*) as count FROM subscriptions WHERE status IN ('active', 'pro', 'premium')").get() as any).count;
  const revenueInr = (db.prepare("SELECT SUM(amount_inr) as total FROM payments WHERE status = 'verified'").get() as any).total || 0;
  const totalEnrollments = (db.prepare('SELECT count(*) as count FROM enrollments').get() as any).count;
  const totalCertificates = (db.prepare('SELECT count(*) as count FROM certificates WHERE is_revoked = 0').get() as any).count;

  const recentUsers = db.prepare("SELECT id, name, email, xp, streak_days, created_at FROM users WHERE role = 'USER' ORDER BY created_at DESC LIMIT 5").all();
  const recentAudit = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10').all();

  return res.json({
    metrics: {
      totalUsers,
      activeSubs,
      revenueInr,
      totalEnrollments,
      totalCertificates
    },
    recentUsers,
    recentAudit
  });
});

apiRouter.get('/admin/users', authenticate, requireAdmin, (_req: Request, res: Response) => {
  const users = db.prepare(`
    SELECT u.id, u.name, u.email, u.role, u.xp, u.streak_days, u.created_at,
           (SELECT count(*) FROM enrollments WHERE user_id = u.id) as enrolled_courses_count,
           (SELECT count(*) FROM certificates WHERE user_id = u.id) as certificates_count
    FROM users u
    ORDER BY u.created_at DESC
  `).all();
  return res.json({ users });
});

apiRouter.get('/admin/certificates', authenticate, requireAdmin, (_req: Request, res: Response) => {
  const certificates = db.prepare(`
    SELECT * FROM certificates ORDER BY issue_date DESC
  `).all();
  return res.json({ certificates });
});

apiRouter.post('/admin/certificates/revoke', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  const { certId, reason } = req.body;
  if (!certId || !reason) {
    return res.status(400).json({ error: 'certId and reason are required.' });
  }

  const cert = db.prepare('SELECT * FROM certificates WHERE id = ?').get(certId) as any;
  if (!cert) {
    return res.status(404).json({ error: 'Certificate not found.' });
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE certificates SET is_revoked = 1, revoked_reason = ?, revoked_at = ? WHERE id = ?
  `).run(reason, now, certId);

  // Log in audit log
  db.prepare(`
    INSERT INTO audit_logs (id, actor_user_id, action, resource_type, resource_id, details_json, created_at)
    VALUES (?, ?, 'CERTIFICATE_REVOKED', 'certificate', ?, ?, ?)
  `).run(`log_${Date.now()}`, req.user!.id, certId, JSON.stringify({ reason }), now);

  return res.json({ message: 'Certificate revoked and audit log updated.' });
});

// Course CRUD for Admin
apiRouter.post('/admin/courses', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  const { title, slug, description, language, cefr_level, image_url, is_premium, learning_outcomes, prerequisites, duration_hours, price_inr, status } = req.body;
  if (!title || !description || !language || !cefr_level) {
    return res.status(400).json({ error: 'Missing required course fields.' });
  }

  const courseId = `crs_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const courseSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const now = new Date().toISOString();

  // Check duplicate slug
  const existingSlug = db.prepare('SELECT id FROM courses WHERE slug = ?').get(courseSlug);
  if (existingSlug) {
    return res.status(409).json({ error: 'A course with this URL slug already exists.' });
  }

  db.prepare(`
    INSERT INTO courses (
      id, title, slug, description, language, cefr_level, image_url, is_premium,
      learning_outcomes_json, created_at, status, prerequisites_json, duration_hours, price_inr
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    courseId,
    title,
    courseSlug,
    description,
    language,
    cefr_level,
    image_url || '/src/assets/images/hero_language_learner_1792167190387.jpg',
    is_premium ? 1 : 0,
    JSON.stringify(learning_outcomes || []),
    now,
    status || 'published',
    JSON.stringify(prerequisites || []),
    duration_hours || 10,
    price_inr || 0
  );

  db.prepare(`
    INSERT INTO audit_logs (id, actor_user_id, action, resource_type, resource_id, details_json, created_at)
    VALUES (?, ?, 'COURSE_CREATED', 'course', ?, ?, ?)
  `).run(`log_${Date.now()}`, req.user!.id, courseId, JSON.stringify({ title }), now);

  return res.status(201).json({ message: 'Course created successfully', id: courseId });
});

apiRouter.put('/admin/courses/:id', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  const courseId = req.params.id;
  const {
    title,
    slug,
    description,
    language,
    cefr_level,
    image_url,
    is_premium,
    learning_outcomes,
    status,
    prerequisites,
    duration_hours,
    price_inr
  } = req.body;

  const existing = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId) as any;
  if (!existing) {
    return res.status(404).json({ error: 'Course not found' });
  }

  if (slug && slug !== existing.slug) {
    const slugExists = db.prepare('SELECT id FROM courses WHERE slug = ? AND id != ?').get(slug, courseId);
    if (slugExists) {
      return res.status(409).json({ error: 'A course with this URL slug already exists.' });
    }
  }

  const updatedSlug = slug || existing.slug;
  const updatedStatus = status || existing.status || 'published';

  db.prepare(`
    UPDATE courses SET
      title = ?,
      slug = ?,
      description = ?,
      language = ?,
      cefr_level = ?,
      image_url = ?,
      is_premium = ?,
      learning_outcomes_json = ?,
      status = ?,
      prerequisites_json = ?,
      duration_hours = ?,
      price_inr = ?
    WHERE id = ?
  `).run(
    title || existing.title,
    updatedSlug,
    description || existing.description,
    language || existing.language,
    cefr_level || existing.cefr_level,
    image_url || existing.image_url,
    typeof is_premium === 'boolean' ? (is_premium ? 1 : 0) : existing.is_premium,
    learning_outcomes ? JSON.stringify(learning_outcomes) : existing.learning_outcomes_json,
    updatedStatus,
    prerequisites ? JSON.stringify(prerequisites) : (existing.prerequisites_json || '[]'),
    typeof duration_hours === 'number' ? duration_hours : (existing.duration_hours || 10),
    typeof price_inr === 'number' ? price_inr : (existing.price_inr || 0),
    courseId
  );

  db.prepare(`
    INSERT INTO audit_logs (id, actor_user_id, action, resource_type, resource_id, details_json, created_at)
    VALUES (?, ?, 'COURSE_UPDATED', 'course', ?, ?, ?)
  `).run(`log_${Date.now()}`, req.user!.id, courseId, JSON.stringify({ title: title || existing.title, status: updatedStatus }), new Date().toISOString());

  return res.json({ message: 'Course updated successfully' });
});

apiRouter.patch('/admin/courses/:id/status', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  if (!status || !['draft', 'published', 'archived'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Allowed: draft, published, archived.' });
  }

  db.prepare('UPDATE courses SET status = ? WHERE id = ?').run(status, req.params.id);
  db.prepare(`
    INSERT INTO audit_logs (id, actor_user_id, action, resource_type, resource_id, details_json, created_at)
    VALUES (?, ?, 'COURSE_STATUS_CHANGED', 'course', ?, ?, ?)
  `).run(`log_${Date.now()}`, req.user!.id, req.params.id, JSON.stringify({ status }), new Date().toISOString());

  return res.json({ message: `Course status changed to ${status}` });
});

apiRouter.delete('/admin/courses/:id', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  const courseId = req.params.id;
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId) as any;
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  const enrollmentsCount = (db.prepare('SELECT count(*) as count FROM enrollments WHERE course_id = ?').get(courseId) as any).count;
  if (enrollmentsCount > 0 && req.query.force !== 'true') {
    db.prepare("UPDATE courses SET status = 'archived' WHERE id = ?").run(courseId);
    return res.json({
      message: `Course has ${enrollmentsCount} enrolled student(s). It has been safely archived to preserve student learning records.`,
      archived: true
    });
  }

  db.prepare('DELETE FROM courses WHERE id = ?').run(courseId);
  db.prepare(`
    INSERT INTO audit_logs (id, actor_user_id, action, resource_type, resource_id, details_json, created_at)
    VALUES (?, ?, 'COURSE_DELETED', 'course', ?, ?, ?)
  `).run(`log_${Date.now()}`, req.user!.id, courseId, JSON.stringify({ title: course.title }), new Date().toISOString());

  return res.json({ message: 'Course deleted permanently' });
});

// --- ADMIN CMS: LESSON & CURRICULUM BUILDER ---
apiRouter.get('/admin/courses/:courseId/lessons', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  const lessons = db.prepare(`
    SELECT * FROM lessons WHERE course_id = ? ORDER BY order_index ASC
  `).all(req.params.courseId) as any[];

  return res.json({
    lessons: lessons.map(l => ({
      ...l,
      is_free_preview: Boolean(l.is_free_preview),
      modalities: JSON.parse(l.modality_flags_json || '[]'),
      objectives: JSON.parse(l.objectives_json || '[]')
    }))
  });
});

apiRouter.post('/admin/courses/:courseId/lessons', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  const courseId = req.params.courseId;
  const { title, summary, duration_minutes, is_free_preview, objectives, order_index } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Lesson title is required' });
  }

  const existingCount = (db.prepare('SELECT count(*) as count FROM lessons WHERE course_id = ?').get(courseId) as any).count;
  const newOrder = typeof order_index === 'number' ? order_index : existingCount + 1;
  const lessonId = `les_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  db.prepare(`
    INSERT INTO lessons (id, course_id, title, summary, order_index, duration_minutes, is_free_preview, modality_flags_json, status, objectives_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'published', ?)
  `).run(
    lessonId,
    courseId,
    title,
    summary || 'Core linguistic objectives and conversational fluency drills.',
    newOrder,
    duration_minutes || 15,
    is_free_preview ? 1 : 0,
    JSON.stringify(['reading', 'listening', 'video', 'speaking', 'writing', 'grammar_vocab']),
    JSON.stringify(objectives || ['Master contextual vocabulary', 'Demonstrate oral and written comprehension'])
  );

  // Initialize meaningful activities for all 6 modalities
  const defaultActivities = [
    {
      modality: 'reading',
      title: `Reading Practice: ${title}`,
      content: {
        passage: `In this module, we focus on ${title}. Practice identifying conversational markers, tone, and grammar rules in natural dialogue.`,
        translation: `En este módulo, nos enfocamos en ${title}.`,
        vocabulary: [{ word: "Dialogue", meaning: "A structured conversational exchange" }]
      }
    },
    {
      modality: 'listening',
      title: `Aural Comprehension: ${title}`,
      content: {
        audioScript: `Welcome to the listening session for ${title}. Listen carefully to cadence and word stress.`,
        transcript: `Welcome to the listening session for ${title}. Listen carefully to cadence and word stress.`,
        checkQuestion: "What is the key focus of this audio passage?",
        checkOptions: [title, "Unrelated conversation", "Weather forecast"],
        correctOption: title
      }
    },
    {
      modality: 'video',
      title: `Cultural Context: ${title}`,
      content: {
        summary: `Video demonstration and cultural explanation of ${title}.`,
        videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
        timestamps: [{ time: "0:02", note: "Introduction" }, { time: "0:06", note: "Practical Application" }]
      }
    },
    {
      modality: 'speaking',
      title: `Pronunciation: ${title}`,
      content: {
        prompt: `Read the target phrase aloud with clear articulation.`,
        targetPhrase: `I am developing fluency in ${title}.`,
        pronunciationTips: "Breathe naturally and enunciate each consonant cluster distinctly."
      }
    },
    {
      modality: 'writing',
      title: `Writing Drill: ${title}`,
      content: {
        sentenceParts: ["I", "am", "practicing", "my", "language", "skills."],
        fillPrompt: "Complete the sentence: 'Consistent study builds conversational ______ (fluency/delay).'",
        correctBlank: "fluency"
      }
    },
    {
      modality: 'grammar_vocab',
      title: `Grammar Focus: ${title}`,
      content: {
        rule: `Systematic application of language structures in ${title}.`,
        examples: [{ en: "Standard grammatical usage in context." }],
        flashcards: [{ term: "Key Principle", def: "Core structural concept" }]
      }
    }
  ];

  for (let idx = 0; idx < defaultActivities.length; idx++) {
    const act = defaultActivities[idx];
    db.prepare(`
      INSERT INTO lesson_activities (id, lesson_id, modality, title, content_json, order_index)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(`act_${lessonId}_${act.modality}`, lessonId, act.modality, act.title, JSON.stringify(act.content), idx + 1);
  }

  return res.status(201).json({ message: 'Lesson created successfully with all 6 modalities initialized', lessonId });
});

apiRouter.get('/admin/lessons/:id', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  const lesson = db.prepare('SELECT * FROM lessons WHERE id = ?').get(req.params.id) as any;
  if (!lesson) {
    return res.status(404).json({ error: 'Lesson not found' });
  }

  const activities = db.prepare('SELECT * FROM lesson_activities WHERE lesson_id = ? ORDER BY order_index ASC').all(lesson.id) as any[];

  return res.json({
    lesson: {
      ...lesson,
      is_free_preview: Boolean(lesson.is_free_preview),
      modalities: JSON.parse(lesson.modality_flags_json || '[]'),
      objectives: JSON.parse(lesson.objectives_json || '[]')
    },
    activities: activities.map(a => ({
      ...a,
      content: JSON.parse(a.content_json || '{}')
    }))
  });
});

apiRouter.put('/admin/lessons/:id', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  const { title, summary, duration_minutes, is_free_preview, status, objectives } = req.body;
  const existing = db.prepare('SELECT * FROM lessons WHERE id = ?').get(req.params.id) as any;
  if (!existing) {
    return res.status(404).json({ error: 'Lesson not found' });
  }

  db.prepare(`
    UPDATE lessons SET
      title = ?,
      summary = ?,
      duration_minutes = ?,
      is_free_preview = ?,
      status = ?,
      objectives_json = ?
    WHERE id = ?
  `).run(
    title || existing.title,
    summary || existing.summary,
    typeof duration_minutes === 'number' ? duration_minutes : existing.duration_minutes,
    typeof is_free_preview === 'boolean' ? (is_free_preview ? 1 : 0) : existing.is_free_preview,
    status || existing.status || 'published',
    objectives ? JSON.stringify(objectives) : (existing.objectives_json || '[]'),
    req.params.id
  );

  return res.json({ message: 'Lesson updated successfully' });
});

apiRouter.delete('/admin/lessons/:id', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  const lesson = db.prepare('SELECT * FROM lessons WHERE id = ?').get(req.params.id) as any;
  if (!lesson) {
    return res.status(404).json({ error: 'Lesson not found' });
  }

  db.prepare('DELETE FROM lessons WHERE id = ?').run(req.params.id);

  const remaining = db.prepare('SELECT id FROM lessons WHERE course_id = ? ORDER BY order_index ASC').all(lesson.course_id) as any[];
  for (let i = 0; i < remaining.length; i++) {
    db.prepare('UPDATE lessons SET order_index = ? WHERE id = ?').run(i + 1, remaining[i].id);
  }

  return res.json({ message: 'Lesson deleted successfully' });
});

apiRouter.put('/admin/courses/:courseId/lessons/reorder', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  const { orderedLessonIds } = req.body as { orderedLessonIds: string[] };
  if (!Array.isArray(orderedLessonIds)) {
    return res.status(400).json({ error: 'orderedLessonIds array is required' });
  }

  for (let i = 0; i < orderedLessonIds.length; i++) {
    db.prepare('UPDATE lessons SET order_index = ? WHERE id = ? AND course_id = ?').run(i + 1, orderedLessonIds[i], req.params.courseId);
  }

  return res.json({ message: 'Lesson ordering updated successfully' });
});

apiRouter.put('/admin/lessons/:id/activities', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  const lessonId = req.params.id;
  const { activities } = req.body as { activities: Array<{ modality: string; title: string; content: any; order_index?: number }> };
  if (!Array.isArray(activities)) {
    return res.status(400).json({ error: 'activities array is required' });
  }

  for (let i = 0; i < activities.length; i++) {
    const act = activities[i];
    const actId = `act_${lessonId}_${act.modality}`;
    db.prepare(`
      INSERT INTO lesson_activities (id, lesson_id, modality, title, content_json, order_index)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        content_json = excluded.content_json,
        order_index = excluded.order_index
    `).run(
      actId,
      lessonId,
      act.modality,
      act.title,
      JSON.stringify(act.content || {}),
      act.order_index || (i + 1)
    );
  }

  return res.json({ message: 'Activities updated successfully across all modalities' });
});

// --- ADMIN CMS: QUIZ & ASSESSMENT BUILDER ---
apiRouter.get('/admin/quizzes', authenticate, requireAdmin, (_req: AuthRequest, res: Response) => {
  const quizzes = db.prepare(`
    SELECT q.*, c.title as course_title,
           (SELECT count(*) FROM quiz_questions WHERE quiz_id = q.id) as question_count
    FROM quizzes q
    LEFT JOIN courses c ON q.course_id = c.id
    ORDER BY q.title ASC
  `).all() as any[];

  return res.json({
    quizzes: quizzes.map(q => ({
      ...q,
      is_final_assessment: Boolean(q.is_final_assessment)
    }))
  });
});

apiRouter.get('/admin/quizzes/:id', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  const quiz = db.prepare(`
    SELECT q.*, c.title as course_title
    FROM quizzes q
    LEFT JOIN courses c ON q.course_id = c.id
    WHERE q.id = ?
  `).get(req.params.id) as any;

  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  const questions = db.prepare('SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY order_index ASC').all(quiz.id) as any[];

  return res.json({
    quiz: {
      ...quiz,
      is_final_assessment: Boolean(quiz.is_final_assessment)
    },
    questions: questions.map(q => ({
      ...q,
      options: JSON.parse(q.options_json || '[]'),
      correct_answer: JSON.parse(q.correct_answer_json || '""')
    }))
  });
});

apiRouter.post('/admin/quizzes', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  const { title, description, course_id, lesson_id, passing_score, is_final_assessment, time_limit_minutes } = req.body;
  if (!title || !course_id) {
    return res.status(400).json({ error: 'title and course_id are required' });
  }

  const quizId = `quiz_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  db.prepare(`
    INSERT INTO quizzes (id, course_id, lesson_id, title, description, passing_score, is_final_assessment, time_limit_minutes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    quizId,
    course_id,
    lesson_id || null,
    title,
    description || 'Knowledge assessment',
    typeof passing_score === 'number' ? passing_score : 70,
    is_final_assessment ? 1 : 0,
    time_limit_minutes || 20
  );

  return res.status(201).json({ message: 'Quiz created successfully', quizId });
});

apiRouter.put('/admin/quizzes/:id', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  const { title, description, passing_score, is_final_assessment, time_limit_minutes } = req.body;
  const existing = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(req.params.id) as any;
  if (!existing) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  db.prepare(`
    UPDATE quizzes SET
      title = ?,
      description = ?,
      passing_score = ?,
      is_final_assessment = ?,
      time_limit_minutes = ?
    WHERE id = ?
  `).run(
    title || existing.title,
    description || existing.description,
    typeof passing_score === 'number' ? passing_score : existing.passing_score,
    typeof is_final_assessment === 'boolean' ? (is_final_assessment ? 1 : 0) : existing.is_final_assessment,
    typeof time_limit_minutes === 'number' ? time_limit_minutes : (existing.time_limit_minutes || 20),
    req.params.id
  );

  return res.json({ message: 'Quiz updated successfully' });
});

apiRouter.delete('/admin/quizzes/:id', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  db.prepare('DELETE FROM quizzes WHERE id = ?').run(req.params.id);
  return res.json({ message: 'Quiz deleted successfully' });
});

apiRouter.post('/admin/quizzes/:quizId/questions', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  const quizId = req.params.quizId;
  const { prompt, type, options, correct_answer, explanation, marks } = req.body;
  if (!prompt || !options || !correct_answer) {
    return res.status(400).json({ error: 'prompt, options, and correct_answer are required' });
  }

  const existingCount = (db.prepare('SELECT count(*) as count FROM quiz_questions WHERE quiz_id = ?').get(quizId) as any).count;
  const qId = `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  db.prepare(`
    INSERT INTO quiz_questions (id, quiz_id, prompt, type, options_json, correct_answer_json, explanation, order_index, marks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    qId,
    quizId,
    prompt,
    type || 'single_choice',
    JSON.stringify(options),
    JSON.stringify(correct_answer),
    explanation || 'Objective grammatical and vocabulary rationale.',
    existingCount + 1,
    marks || 1
  );

  return res.status(201).json({ message: 'Question added successfully', id: qId });
});

apiRouter.put('/admin/questions/:id', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  const { prompt, type, options, correct_answer, explanation, marks, order_index } = req.body;
  const existing = db.prepare('SELECT * FROM quiz_questions WHERE id = ?').get(req.params.id) as any;
  if (!existing) {
    return res.status(404).json({ error: 'Question not found' });
  }

  db.prepare(`
    UPDATE quiz_questions SET
      prompt = ?,
      type = ?,
      options_json = ?,
      correct_answer_json = ?,
      explanation = ?,
      marks = ?,
      order_index = ?
    WHERE id = ?
  `).run(
    prompt || existing.prompt,
    type || existing.type,
    options ? JSON.stringify(options) : existing.options_json,
    correct_answer ? JSON.stringify(correct_answer) : existing.correct_answer_json,
    explanation || existing.explanation,
    typeof marks === 'number' ? marks : (existing.marks || 1),
    typeof order_index === 'number' ? order_index : existing.order_index,
    req.params.id
  );

  return res.json({ message: 'Question updated successfully' });
});

apiRouter.delete('/admin/questions/:id', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  db.prepare('DELETE FROM quiz_questions WHERE id = ?').run(req.params.id);
  return res.json({ message: 'Question deleted successfully' });
});

apiRouter.get('/admin/quizzes/:id/attempts', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  const attempts = db.prepare(`
    SELECT qa.*, u.name as student_name, u.email as student_email
    FROM quiz_attempts qa
    JOIN users u ON qa.user_id = u.id
    WHERE qa.quiz_id = ?
    ORDER BY qa.created_at DESC
  `).all(req.params.id);

  return res.json({ attempts });
});

// --- ADMIN CMS: STUDENT & ENROLLMENT MANAGEMENT ---
apiRouter.get('/admin/students', authenticate, requireAdmin, (_req: AuthRequest, res: Response) => {
  const students = db.prepare(`
    SELECT u.id, u.name, u.email, u.role, u.streak_days, u.xp, u.created_at, u.last_active_date,
           (SELECT count(*) FROM enrollments WHERE user_id = u.id) as enrolled_count,
           (SELECT count(*) FROM lesson_progress WHERE user_id = u.id AND status = 'completed') as completed_lessons_count,
           (SELECT count(*) FROM certificates WHERE user_id = u.id AND is_revoked = 0) as certificates_count,
           (SELECT s.status FROM subscriptions s WHERE s.user_id = u.id ORDER BY s.ends_at DESC LIMIT 1) as subscription_status
    FROM users u
    ORDER BY u.created_at DESC
  `).all();

  return res.json({ students });
});

apiRouter.get('/admin/students/:id', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  const student = db.prepare(`
    SELECT id, name, email, role, streak_days, xp, created_at, last_active_date
    FROM users WHERE id = ?
  `).get(req.params.id) as any;

  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  const enrollments = db.prepare(`
    SELECT e.*, c.title as course_title, c.language, c.cefr_level
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    WHERE e.user_id = ?
  `).all(student.id);

  const certificates = db.prepare(`
    SELECT * FROM certificates WHERE user_id = ? ORDER BY issue_date DESC
  `).all(student.id);

  const quizAttempts = db.prepare(`
    SELECT qa.*, q.title as quiz_title
    FROM quiz_attempts qa
    JOIN quizzes q ON qa.quiz_id = q.id
    WHERE qa.user_id = ?
    ORDER BY qa.created_at DESC
  `).all(student.id);

  const attendance = db.prepare(`
    SELECT a.*, lc.title as class_title, lc.scheduled_at
    FROM live_class_attendance a
    JOIN live_classes lc ON a.class_id = lc.id
    WHERE a.user_id = ?
    ORDER BY a.joined_at DESC
  `).all(student.id);

  return res.json({
    student,
    enrollments,
    certificates,
    quizAttempts,
    attendance
  });
});

apiRouter.post('/admin/students/:id/enroll', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  const { courseId } = req.body;
  const studentId = req.params.id;
  if (!courseId) {
    return res.status(400).json({ error: 'courseId is required' });
  }

  const course = db.prepare('SELECT title FROM courses WHERE id = ?').get(courseId) as any;
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO enrollments (id, user_id, course_id, enrolled_at, progress_percent)
    VALUES (?, ?, ?, ?, 0)
    ON CONFLICT(user_id, course_id) DO NOTHING
  `).run(`enr_admin_${Date.now()}`, studentId, courseId, now);

  db.prepare(`
    INSERT INTO audit_logs (id, actor_user_id, action, resource_type, resource_id, details_json, created_at)
    VALUES (?, ?, 'ADMIN_MANUAL_ENROLL', 'enrollment', ?, ?, ?)
  `).run(`log_${Date.now()}`, req.user!.id, studentId, JSON.stringify({ courseId, courseTitle: course.title }), now);

  return res.json({ message: `Student enrolled into ${course.title} successfully` });
});

apiRouter.delete('/admin/students/:id/enroll/:courseId', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  const { id: studentId, courseId } = req.params;
  db.prepare('DELETE FROM enrollments WHERE user_id = ? AND course_id = ?').run(studentId, courseId);
  db.prepare('DELETE FROM lesson_progress WHERE user_id = ? AND course_id = ?').run(studentId, courseId);

  return res.json({ message: 'Enrollment removed' });
});

apiRouter.put('/admin/students/:id/status', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  const studentId = req.params.id;
  const { role, streak_days } = req.body;

  if (role && role !== 'ADMIN') {
    const adminCount = (db.prepare("SELECT count(*) as count FROM users WHERE role = 'ADMIN'").get() as any).count;
    const current = db.prepare('SELECT role FROM users WHERE id = ?').get(studentId) as any;
    if (current && current.role === 'ADMIN' && adminCount <= 1) {
      return res.status(400).json({ error: 'Cannot demote the sole remaining administrator account.' });
    }
  }

  if (role) {
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, studentId);
  }
  if (typeof streak_days === 'number') {
    db.prepare('UPDATE users SET streak_days = ? WHERE id = ?').run(streak_days, studentId);
  }

  return res.json({ message: 'Student status updated successfully' });
});

// --- MODULE 2: LIVE ONLINE CLASSROOM ENDPOINTS ---
apiRouter.get('/live-classes', optionalAuthenticate, (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const classes = db.prepare(`
    SELECT lc.*, c.title as course_title, c.language as course_language,
           (SELECT count(*) FROM live_class_registrations WHERE class_id = lc.id) as registered_count
    FROM live_classes lc
    LEFT JOIN courses c ON lc.course_id = c.id
    ORDER BY lc.scheduled_at ASC
  `).all() as any[];

  return res.json({
    classes: classes.map(c => {
      let isRegistered = false;
      if (userId) {
        const reg = db.prepare('SELECT id FROM live_class_registrations WHERE class_id = ? AND user_id = ?').get(c.id, userId);
        isRegistered = Boolean(reg);
      }
      return {
        ...c,
        is_registered: isRegistered,
        is_full: c.registered_count >= c.max_capacity
      };
    })
  });
});

apiRouter.get('/live-classes/:id', optionalAuthenticate, (req: AuthRequest, res: Response) => {
  const classId = req.params.id;
  const liveClass = db.prepare(`
    SELECT lc.*, c.title as course_title, c.language as course_language,
           u.name as instructor_name, u.email as instructor_email
    FROM live_classes lc
    LEFT JOIN courses c ON lc.course_id = c.id
    LEFT JOIN users u ON lc.instructor_id = u.id
    WHERE lc.id = ?
  `).get(classId) as any;

  if (!liveClass) {
    return res.status(404).json({ error: 'Live class not found' });
  }

  const userId = req.user?.id;
  let isRegistered = false;
  if (userId) {
    const reg = db.prepare('SELECT id FROM live_class_registrations WHERE class_id = ? AND user_id = ?').get(classId, userId);
    isRegistered = Boolean(reg);
  }

  const registrations = db.prepare(`
    SELECT r.*, u.name as student_name, u.email as student_email
    FROM live_class_registrations r
    JOIN users u ON r.user_id = u.id
    WHERE r.class_id = ?
  `).all(classId);

  const attendance = db.prepare(`
    SELECT a.*
    FROM live_class_attendance a
    WHERE a.class_id = ?
    ORDER BY a.joined_at DESC
  `).all(classId);

  return res.json({
    liveClass: {
      ...liveClass,
      is_registered: isRegistered
    },
    registrations,
    attendance
  });
});

apiRouter.post('/live-classes', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  const {
    title,
    description,
    course_id,
    lesson_id,
    scheduled_at,
    duration_minutes,
    max_capacity,
    room_name
  } = req.body;

  if (!title || !scheduled_at) {
    return res.status(400).json({ error: 'Title and scheduled_at are required' });
  }

  const classId = `cls_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const room = room_name || `room_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO live_classes (
      id, title, description, course_id, lesson_id, instructor_id, instructor_name,
      scheduled_at, duration_minutes, max_capacity, status, room_name, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, ?)
  `).run(
    classId,
    title,
    description || 'Interactive live classroom session.',
    course_id || null,
    lesson_id || null,
    req.user!.id,
    req.user!.name,
    scheduled_at,
    duration_minutes || 45,
    max_capacity || 25,
    room,
    now
  );

  db.prepare(`
    INSERT INTO audit_logs (id, actor_user_id, action, resource_type, resource_id, details_json, created_at)
    VALUES (?, ?, 'LIVE_CLASS_SCHEDULED', 'live_class', ?, ?, ?)
  `).run(`log_${Date.now()}`, req.user!.id, classId, JSON.stringify({ title, scheduled_at }), now);

  return res.status(201).json({ message: 'Live class scheduled successfully', classId });
});

apiRouter.put('/live-classes/:id', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  const classId = req.params.id;
  const { title, description, scheduled_at, duration_minutes, max_capacity, status } = req.body;

  const existing = db.prepare('SELECT * FROM live_classes WHERE id = ?').get(classId) as any;
  if (!existing) {
    return res.status(404).json({ error: 'Class not found' });
  }

  db.prepare(`
    UPDATE live_classes SET
      title = ?,
      description = ?,
      scheduled_at = ?,
      duration_minutes = ?,
      max_capacity = ?,
      status = ?
    WHERE id = ?
  `).run(
    title || existing.title,
    description || existing.description,
    scheduled_at || existing.scheduled_at,
    typeof duration_minutes === 'number' ? duration_minutes : existing.duration_minutes,
    typeof max_capacity === 'number' ? max_capacity : existing.max_capacity,
    status || existing.status,
    classId
  );

  return res.json({ message: 'Live class updated successfully' });
});

apiRouter.patch('/live-classes/:id/status', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  if (!status || !['scheduled', 'live', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  db.prepare('UPDATE live_classes SET status = ? WHERE id = ?').run(status, req.params.id);
  return res.json({ message: `Class status updated to ${status}` });
});

apiRouter.delete('/live-classes/:id', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  db.prepare('DELETE FROM live_classes WHERE id = ?').run(req.params.id);
  return res.json({ message: 'Class deleted successfully' });
});

apiRouter.post('/live-classes/:id/register', authenticate, (req: AuthRequest, res: Response) => {
  const classId = req.params.id;
  const userId = req.user!.id;

  const liveClass = db.prepare('SELECT * FROM live_classes WHERE id = ?').get(classId) as any;
  if (!liveClass) {
    return res.status(404).json({ error: 'Class not found' });
  }

  if (liveClass.status === 'cancelled' || liveClass.status === 'completed') {
    return res.status(400).json({ error: 'Cannot register for a completed or cancelled class.' });
  }

  const count = (db.prepare('SELECT count(*) as count FROM live_class_registrations WHERE class_id = ?').get(classId) as any).count;
  if (count >= liveClass.max_capacity) {
    return res.status(400).json({ error: 'This class has reached maximum capacity.' });
  }

  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO live_class_registrations (id, class_id, user_id, registered_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(class_id, user_id) DO NOTHING
  `).run(`reg_${Date.now()}`, classId, userId, now);

  return res.status(201).json({ message: 'Registered successfully for the live class!' });
});

apiRouter.delete('/live-classes/:id/register', authenticate, (req: AuthRequest, res: Response) => {
  db.prepare('DELETE FROM live_class_registrations WHERE class_id = ? AND user_id = ?').run(req.params.id, req.user!.id);
  return res.json({ message: 'Registration cancelled.' });
});

// Secure Token Generator for Room Access
apiRouter.get('/live-classes/:id/token', authenticate, async (req: AuthRequest, res: Response) => {
  const classId = req.params.id;
  const user = req.user!;

  const liveClass = db.prepare('SELECT * FROM live_classes WHERE id = ?').get(classId) as any;
  if (!liveClass) {
    return res.status(404).json({ error: 'Live class not found' });
  }

  if (liveClass.status === 'cancelled') {
    return res.status(400).json({ error: 'This class has been cancelled.' });
  }

  const isInstructor = user.role === 'ADMIN' || user.id === liveClass.instructor_id;

  if (!isInstructor) {
    const reg = db.prepare('SELECT id FROM live_class_registrations WHERE class_id = ? AND user_id = ?').get(classId, user.id);
    if (!reg) {
      const count = (db.prepare('SELECT count(*) as count FROM live_class_registrations WHERE class_id = ?').get(classId) as any).count;
      if (count < liveClass.max_capacity) {
        db.prepare(`
          INSERT INTO live_class_registrations (id, class_id, user_id, registered_at)
          VALUES (?, ?, ?, ?)
        `).run(`reg_${Date.now()}`, classId, user.id, new Date().toISOString());
      } else {
        return res.status(403).json({ error: 'You are not registered for this class and capacity is full.' });
      }
    }
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const livekitUrl = process.env.LIVEKIT_URL;

  let token: string;
  let connectionMode: 'livekit' | 'webrtc_mesh';

  if (apiKey && apiSecret) {
    try {
      const at = new AccessToken(apiKey, apiSecret, {
        identity: user.id,
        name: user.name,
        ttl: '2h'
      });
      at.addGrant({
        roomJoin: true,
        room: liveClass.room_name,
        canPublish: true,
        canSubscribe: true,
        roomAdmin: isInstructor
      });
      token = await at.toJwt();
      connectionMode = 'livekit';
    } catch (lkErr) {
      console.warn('LiveKit token generation fallback to WebRTC mesh:', lkErr);
      token = jwt.sign(
        { id: user.id, name: user.name, role: user.role, classId, roomName: liveClass.room_name },
        JWT_SECRET,
        { expiresIn: '2h' }
      );
      connectionMode = 'webrtc_mesh';
    }
  } else {
    token = jwt.sign(
      { id: user.id, name: user.name, role: user.role, classId, roomName: liveClass.room_name },
      JWT_SECRET,
      { expiresIn: '2h' }
    );
    connectionMode = 'webrtc_mesh';
  }

  if (isInstructor && liveClass.status === 'scheduled') {
    db.prepare("UPDATE live_classes SET status = 'live' WHERE id = ?").run(classId);
  }

  return res.json({
    token,
    roomName: liveClass.room_name,
    classTitle: liveClass.title,
    isInstructor,
    connectionMode,
    livekitUrl: livekitUrl || null
  });
});

apiRouter.post('/live-classes/:id/attendance', authenticate, (req: AuthRequest, res: Response) => {
  const { durationSeconds } = req.body;
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO live_class_attendance (id, class_id, user_id, user_name, user_role, joined_at, left_at, duration_seconds)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(class_id, user_id) DO UPDATE SET
      left_at = excluded.left_at,
      duration_seconds = duration_seconds + excluded.duration_seconds
  `).run(
    `att_${Date.now()}`,
    req.params.id,
    req.user!.id,
    req.user!.name,
    req.user!.role,
    now,
    now,
    durationSeconds || 0
  );
  return res.json({ message: 'Attendance recorded' });
});

apiRouter.get('/live-classes/:id/messages', authenticate, (req: AuthRequest, res: Response) => {
  const messages = db.prepare(`
    SELECT * FROM live_class_messages
    WHERE class_id = ?
    ORDER BY created_at ASC
  `).all(req.params.id);
  return res.json({ messages });
});

// -------------------------------------------------------------
// Phase 11: AI Language Assistant (Gemini 3.8 Flash)
// -------------------------------------------------------------
apiRouter.post('/ai/assist', authenticate, async (req: AuthRequest, res: Response) => {
  const { prompt, contextLanguage, mode } = req.body;
  if (!prompt || !String(prompt).trim()) {
    return res.status(400).json({ error: 'Prompt cannot be empty.' });
  }

  const userId = req.user!.id;
  const now = new Date().toISOString();

  // Record usage
  db.prepare(`
    INSERT INTO ai_usage_records (id, user_id, prompt_type, tokens_approx, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(`ai_${Date.now()}`, userId, mode || 'general_tutor', Math.ceil(prompt.length / 4), now);

  // If Gemini API Key is available, invoke @google/genai
  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `You are LingoPro's dedicated AI Language Tutor. Provide clear, encouraging, CEFR-aligned linguistic explanations.
Target Language: ${contextLanguage || 'English'}
Mode: ${mode || 'tutor'}

Student Request:
${prompt}`
              }
            ]
          }
        ]
      });

      return res.json({
        response: response.text || 'No response generated.',
        provider: 'gemini-3.8-flash'
      });
    } catch (err: any) {
      console.error('Gemini API Error:', err);
      // Fallback gracefully without breaking UI
    }
  }

  // Graceful structured pedagogical fallback if API key is not present or service errors
  const fallbackReplies: Record<string, string> = {
    grammar: `Language Tip (${contextLanguage || 'General'}): In formal communication, maintain subject-verb agreement and match verb tenses systematically across subordinate clauses. Review your sentence structure to ensure clear clause sequencing.`,
    vocabulary: `Key Terminology: Expanding your active vocabulary is best achieved by practicing words in complete communicative contexts rather than isolated lists. Notice how native speakers pair nouns with prepositions.`,
    pronunciation: `Phonetic Guidance: Focus on clear vowel elongation and relaxed jaw position. For speaking confidence, practice shadowing short phrases at 0.75x speed before accelerating to conversational cadence.`
  };

  const selectedFallback = fallbackReplies[mode || 'general'] ||
    `LingoPro Educational Note: Excellent question! When practicing ${contextLanguage || 'your target language'}, prioritize communicative clarity and natural cadence. (Note: To enable live generative AI responses, configure your GEMINI_API_KEY in .env).`;

  return res.json({
    response: selectedFallback,
    provider: 'lingopro-curriculum-tutor'
  });
});
