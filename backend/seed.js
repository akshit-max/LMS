/**
 * GrammoQuest — Firestore Seed Script
 * 
 * Seeds 1 unit, 3 chapters, 3 quizzes, and sample questions.
 * Run: node seed.js
 * 
 * Requirements:
 *   npm install firebase-admin
 *   Set GOOGLE_APPLICATION_CREDENTIALS or use the serviceAccountKey path below.
 */

const admin = require('firebase-admin')

// ─────────────────────────────────────────────
// CONFIG — update with your Firebase project
// ─────────────────────────────────────────────
const SERVICE_ACCOUNT_PATH = './firebase-service-account.json'
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'your-firebase-project-id'

let serviceAccount
try {
  serviceAccount = require(SERVICE_ACCOUNT_PATH)
} catch {
  console.error('❌ No service account key found at', SERVICE_ACCOUNT_PATH)
  console.error('   Download from Firebase Console → Project Settings → Service Accounts')
  process.exit(1)
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: PROJECT_ID,
})

const db = admin.firestore()

// ─────────────────────────────────────────────
// SEED DATA
// ─────────────────────────────────────────────

const unit1 = {
  id: 'unit-1',
  title: 'The Simple Present Tense',
  description: 'Learn how to form and use simple present tense sentences in English.',
  order: 1,
  chapterCount: 3,
  isActive: true,
  createdAt: new Date(),
}

const chapters = [
  {
    id: 'ch-1-1',
    unitId: 'unit-1',
    title: 'Subject-Verb Agreement',
    order: 1,
    lessonVideoUrl: '',
    pdfUrl: '',
    quizId: 'quiz-1-1',
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: 'ch-1-2',
    unitId: 'unit-1',
    title: 'Positive and Negative Forms',
    order: 2,
    lessonVideoUrl: '',
    pdfUrl: '',
    quizId: 'quiz-1-2',
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: 'ch-1-3',
    unitId: 'unit-1',
    title: 'Questions and Short Answers',
    order: 3,
    lessonVideoUrl: '',
    pdfUrl: '',
    quizId: 'quiz-1-3',
    isActive: true,
    createdAt: new Date(),
  },
]

const quizzes = [
  {
    id: 'quiz-1-1',
    chapterId: 'ch-1-1',
    unitId: 'unit-1',
    title: 'Subject-Verb Agreement Quiz',
    questionIds: ['q-1-1-1', 'q-1-1-2', 'q-1-1-3', 'q-1-1-4', 'q-1-1-5'],
    passingScore: 90,
    tier: 'admin',
    createdBy: 'seed',
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: 'quiz-1-2',
    chapterId: 'ch-1-2',
    unitId: 'unit-1',
    title: 'Positive and Negative Forms Quiz',
    questionIds: ['q-1-2-1', 'q-1-2-2', 'q-1-2-3', 'q-1-2-4', 'q-1-2-5'],
    passingScore: 90,
    tier: 'admin',
    createdBy: 'seed',
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: 'quiz-1-3',
    chapterId: 'ch-1-3',
    unitId: 'unit-1',
    title: 'Questions and Short Answers Quiz',
    questionIds: ['q-1-3-1', 'q-1-3-2', 'q-1-3-3', 'q-1-3-4', 'q-1-3-5'],
    passingScore: 90,
    tier: 'admin',
    createdBy: 'seed',
    isActive: true,
    createdAt: new Date(),
  },
]

const questions = [
  // Quiz 1-1: Subject-Verb Agreement
  {
    id: 'q-1-1-1', quizId: 'quiz-1-1', chapterId: 'ch-1-1', unitId: 'unit-1',
    type: 'mcq', text: 'She _____ to school every day.',
    options: ['go', 'goes', 'going', 'gone'],
    correctAnswer: 'goes',
    explanation: 'With third-person singular subjects (he, she, it), we add -s or -es to the verb.',
    difficulty: 'easy', grammarTopic: 'subject-verb-agreement',
    tier: 'admin', createdBy: 'seed', approvalStatus: 'approved', usageCount: 0, createdAt: new Date(),
  },
  {
    id: 'q-1-1-2', quizId: 'quiz-1-1', chapterId: 'ch-1-1', unitId: 'unit-1',
    type: 'mcq', text: 'They _____ football on weekends.',
    options: ['plays', 'play', 'playing', 'played'],
    correctAnswer: 'play',
    explanation: 'With plural subjects (they, we, you), we use the base form of the verb.',
    difficulty: 'easy', grammarTopic: 'subject-verb-agreement',
    tier: 'admin', createdBy: 'seed', approvalStatus: 'approved', usageCount: 0, createdAt: new Date(),
  },
  {
    id: 'q-1-1-3', quizId: 'quiz-1-1', chapterId: 'ch-1-1', unitId: 'unit-1',
    type: 'true_false', text: '"He go to the market" is grammatically correct.',
    options: ['True', 'False'],
    correctAnswer: 'False',
    explanation: 'The correct form is "He goes" — third-person singular requires -es.',
    difficulty: 'easy', grammarTopic: 'subject-verb-agreement',
    tier: 'admin', createdBy: 'seed', approvalStatus: 'approved', usageCount: 0, createdAt: new Date(),
  },
  {
    id: 'q-1-1-4', quizId: 'quiz-1-1', chapterId: 'ch-1-1', unitId: 'unit-1',
    type: 'mcq', text: 'The dog _____ loudly at night.',
    options: ['bark', 'barks', 'barking', 'barked'],
    correctAnswer: 'barks',
    explanation: '"The dog" is third-person singular, so the verb takes -s.',
    difficulty: 'easy', grammarTopic: 'subject-verb-agreement',
    tier: 'admin', createdBy: 'seed', approvalStatus: 'approved', usageCount: 0, createdAt: new Date(),
  },
  {
    id: 'q-1-1-5', quizId: 'quiz-1-1', chapterId: 'ch-1-1', unitId: 'unit-1',
    type: 'fill_blank', text: 'My parents _____ (love/loves) cooking together.',
    options: ['love', 'loves', 'loving', 'loved'],
    correctAnswer: 'love',
    explanation: '"My parents" is plural, so we use "love" without -s.',
    difficulty: 'medium', grammarTopic: 'subject-verb-agreement',
    tier: 'admin', createdBy: 'seed', approvalStatus: 'approved', usageCount: 0, createdAt: new Date(),
  },

  // Quiz 1-2: Positive and Negative Forms
  {
    id: 'q-1-2-1', quizId: 'quiz-1-2', chapterId: 'ch-1-2', unitId: 'unit-1',
    type: 'mcq', text: 'He _____ like pizza.',
    options: ["don't", "doesn't", 'not', "isn't"],
    correctAnswer: "doesn't",
    explanation: 'For negatives with he/she/it, we use "doesn\'t" + base verb.',
    difficulty: 'easy', grammarTopic: 'negative-form',
    tier: 'admin', createdBy: 'seed', approvalStatus: 'approved', usageCount: 0, createdAt: new Date(),
  },
  {
    id: 'q-1-2-2', quizId: 'quiz-1-2', chapterId: 'ch-1-2', unitId: 'unit-1',
    type: 'true_false', text: '"I doesn\'t speak French" is correct.',
    options: ['True', 'False'],
    correctAnswer: 'False',
    explanation: 'With I/you/we/they, we use "don\'t" not "doesn\'t".',
    difficulty: 'easy', grammarTopic: 'negative-form',
    tier: 'admin', createdBy: 'seed', approvalStatus: 'approved', usageCount: 0, createdAt: new Date(),
  },
  {
    id: 'q-1-2-3', quizId: 'quiz-1-2', chapterId: 'ch-1-2', unitId: 'unit-1',
    type: 'mcq', text: 'We _____ eat meat. (negative)',
    options: ["don't", "doesn't", 'not eat', "aren't"],
    correctAnswer: "don't",
    explanation: '"We" is plural/first-person plural, so we use "don\'t".',
    difficulty: 'easy', grammarTopic: 'negative-form',
    tier: 'admin', createdBy: 'seed', approvalStatus: 'approved', usageCount: 0, createdAt: new Date(),
  },
  {
    id: 'q-1-2-4', quizId: 'quiz-1-2', chapterId: 'ch-1-2', unitId: 'unit-1',
    type: 'mcq', text: 'The teacher _____ the answer.',
    options: ['know', 'knows', 'knowed', 'knowing'],
    correctAnswer: 'knows',
    explanation: '"The teacher" is third-person singular — add -s to know.',
    difficulty: 'easy', grammarTopic: 'positive-form',
    tier: 'admin', createdBy: 'seed', approvalStatus: 'approved', usageCount: 0, createdAt: new Date(),
  },
  {
    id: 'q-1-2-5', quizId: 'quiz-1-2', chapterId: 'ch-1-2', unitId: 'unit-1',
    type: 'fill_blank', text: 'She _____ (not/wake) up early on Sundays.',
    options: ["doesn't wake", "don't wake", "not wake", "isn't wake"],
    correctAnswer: "doesn't wake",
    explanation: 'Negative of she: doesn\'t + base verb (wake, not wakes).',
    difficulty: 'medium', grammarTopic: 'negative-form',
    tier: 'admin', createdBy: 'seed', approvalStatus: 'approved', usageCount: 0, createdAt: new Date(),
  },

  // Quiz 1-3: Questions and Short Answers
  {
    id: 'q-1-3-1', quizId: 'quiz-1-3', chapterId: 'ch-1-3', unitId: 'unit-1',
    type: 'mcq', text: '_____ she speak English?',
    options: ['Do', 'Does', 'Is', 'Are'],
    correctAnswer: 'Does',
    explanation: 'For yes/no questions with he/she/it, use "Does" at the start.',
    difficulty: 'easy', grammarTopic: 'question-form',
    tier: 'admin', createdBy: 'seed', approvalStatus: 'approved', usageCount: 0, createdAt: new Date(),
  },
  {
    id: 'q-1-3-2', quizId: 'quiz-1-3', chapterId: 'ch-1-3', unitId: 'unit-1',
    type: 'true_false', text: 'The question "Do they lives here?" is correct.',
    options: ['True', 'False'],
    correctAnswer: 'False',
    explanation: 'After "Do/Does", the verb is always in base form: "Do they live here?"',
    difficulty: 'easy', grammarTopic: 'question-form',
    tier: 'admin', createdBy: 'seed', approvalStatus: 'approved', usageCount: 0, createdAt: new Date(),
  },
  {
    id: 'q-1-3-3', quizId: 'quiz-1-3', chapterId: 'ch-1-3', unitId: 'unit-1',
    type: 'mcq', text: '"Does he work here?" — "Yes, _____."',
    options: ['he work', 'he does', 'he do', 'he is'],
    correctAnswer: 'he does',
    explanation: 'Short answer: Yes, + subject + does/do. "Yes, he does."',
    difficulty: 'medium', grammarTopic: 'short-answers',
    tier: 'admin', createdBy: 'seed', approvalStatus: 'approved', usageCount: 0, createdAt: new Date(),
  },
  {
    id: 'q-1-3-4', quizId: 'quiz-1-3', chapterId: 'ch-1-3', unitId: 'unit-1',
    type: 'mcq', text: '_____ they play cricket?',
    options: ['Does', 'Do', 'Is', 'Are'],
    correctAnswer: 'Do',
    explanation: 'With "they" (plural), use "Do" to form questions.',
    difficulty: 'easy', grammarTopic: 'question-form',
    tier: 'admin', createdBy: 'seed', approvalStatus: 'approved', usageCount: 0, createdAt: new Date(),
  },
  {
    id: 'q-1-3-5', quizId: 'quiz-1-3', chapterId: 'ch-1-3', unitId: 'unit-1',
    type: 'reorder',
    text: 'Arrange the words to form a correct question:',
    options: ['she', 'Does', 'every day', 'read', '?'],
    correctAnswer: 'Does she read every day ?',
    explanation: 'Question word order: Does + subject + base verb + rest.',
    difficulty: 'medium', grammarTopic: 'question-form',
    tier: 'admin', createdBy: 'seed', approvalStatus: 'approved', usageCount: 0, createdAt: new Date(),
  },
]

// ─────────────────────────────────────────────
// SEED ADMIN USER (update uid with real Firebase UID)
// ─────────────────────────────────────────────
const ADMIN_UID = process.env.ADMIN_UID || 'REPLACE_WITH_REAL_ADMIN_UID'

const adminUser = {
  uid: ADMIN_UID,
  email: 'admin@grammoquest.com',
  displayName: 'Platform Admin',
  role: 'admin',
  studentType: '',
  accountStatus: 'active',
  institutionId: '',
  classId: '',
  avatarId: '',
  isIndependent: false,
  createdAt: new Date(),
  approvedAt: new Date(),
}

// ─────────────────────────────────────────────
// RUN SEED
// ─────────────────────────────────────────────
async function seed() {
  console.log('🌱 Starting GrammoQuest Firestore seed...\n')

  const batch = db.batch()

  // Unit
  batch.set(db.collection('units').doc(unit1.id), unit1)
  console.log(`✅ Unit: ${unit1.title}`)

  // Chapters
  for (const ch of chapters) {
    batch.set(db.collection('chapters').doc(ch.id), ch)
    console.log(`  📖 Chapter: ${ch.title}`)
  }

  // Quizzes
  for (const q of quizzes) {
    batch.set(db.collection('quizzes').doc(q.id), q)
    console.log(`  🎯 Quiz: ${q.title} (${q.questionIds.length} questions)`)
  }

  // Questions
  for (const q of questions) {
    batch.set(db.collection('questions').doc(q.id), q)
  }
  console.log(`  ❓ ${questions.length} questions seeded`)

  await batch.commit()
  console.log('\n✅ Curriculum seeded successfully!\n')

  // Admin user (only if uid is set)
  if (ADMIN_UID !== 'REPLACE_WITH_REAL_ADMIN_UID') {
    await db.collection('users').doc(ADMIN_UID).set(adminUser, { merge: true })
    console.log(`✅ Admin user created: ${adminUser.email}`)
  } else {
    console.log('⚠️  Admin user NOT created — set ADMIN_UID env var or update seed.js')
    console.log('   After creating your admin in Firebase Auth, run:')
    console.log('   ADMIN_UID=<your-uid> node seed.js')
  }

  console.log('\n🎉 Seed complete! Run the backend and frontend to test.\n')
  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
