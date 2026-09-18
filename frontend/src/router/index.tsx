import { createBrowserRouter } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { ProtectedRoute, PublicRoute } from './ProtectedRoute'

// ─── Page imports ────────────────────────────────────────────────────────────

const LandingPage    = lazy(() => import('@/features/landing/LandingPage'))
const LoginPage      = lazy(() => import('@/features/auth/LoginPage'))
const RegisterPage   = lazy(() => import('@/features/auth/RegisterPage'))

// Status pages
const PendingApprovalPage     = lazy(() => import('@/features/auth/PendingApprovalPage'))
const UnauthorizedPage        = lazy(() => import('@/features/auth/UnauthorizedPage'))
const SuspendedPage           = lazy(() => import('@/features/auth/SuspendedPage'))
const SubscriptionExpiredPage = lazy(() => import('@/features/auth/SubscriptionExpiredPage'))

// Student pages
const StudentDashboard = lazy(() => import('@/features/student/StudentDashboard'))
const UnitPage         = lazy(() => import('@/features/student/UnitPage'))
const ChapterPage      = lazy(() => import('@/features/student/ChapterPage'))
const QuizIntroPage    = lazy(() => import('@/features/student/QuizIntroPage'))
const QuizPage         = lazy(() => import('@/features/student/QuizPage'))
const QuizResultPage   = lazy(() => import('@/features/student/QuizResultPage'))

const VideoLessonPage         = lazy(() => import('@/features/student/VideoLessonPage'))
const GrammarNotesPage        = lazy(() => import('@/features/student/GrammarNotesPage'))
const InteractiveLessonPage   = lazy(() => import('@/features/student/InteractiveLessonPage'))
const MyProgressPage          = lazy(() => import('@/features/student/MyProgressPage'))
const LeaderboardPage         = lazy(() => import('@/features/student/LeaderboardPage'))

// Practice Arena — separate from mastery quiz flow
const PracticeIntroPage  = lazy(() => import('@/features/student/practice/PracticeIntroPage'))
const PracticePlayPage   = lazy(() => import('@/features/student/practice/PracticePlayPage'))
const PracticeResultPage = lazy(() => import('@/features/student/practice/PracticeResultPage'))

// Admin pages
const AdminDashboard = lazy(() => import('@/features/admin/AdminDashboard'))

// ─── Loading fallback ─────────────────────────────────────────────────────────

function PageLoader() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white font-sans selection:bg-orange-500 selection:text-white p-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-orange-500 border-r-amber-400 border-b-orange-600 animate-spin" />
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-2xl shadow-md border-2 border-white relative z-10">
            🦊
          </div>
        </div>
        <p className="text-slate-900 text-xs font-black uppercase tracking-widest bg-orange-50 border border-orange-200 px-4 py-1.5 rounded-full shadow-2xs">
          Loading GrammoQuest...
        </p>
      </div>
    </div>
  )
}

function S({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const router = createBrowserRouter([
  // Public
  { path: '/', element: <S><LandingPage /></S> },
  { path: '/login',    element: <PublicRoute><S><LoginPage /></S></PublicRoute> },
  { path: '/register', element: <PublicRoute><S><RegisterPage /></S></PublicRoute> },

  // Status pages
  { path: '/pending-approval',      element: <S><PendingApprovalPage /></S> },
  { path: '/unauthorized',          element: <S><UnauthorizedPage /></S> },
  { path: '/suspended',             element: <S><SuspendedPage /></S> },
  { path: '/subscription-expired',  element: <S><SubscriptionExpiredPage /></S> },

  // ── Student routes ────────────────────────────────────────────────────────
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute roles={['student']} requireActive>
        <S><StudentDashboard /></S>
      </ProtectedRoute>
    ),
  },
  {
    path: '/units/:unitId',
    element: (
      <ProtectedRoute roles={['student']} requireActive>
        <S><UnitPage /></S>
      </ProtectedRoute>
    ),
  },
  {
    path: '/chapters/:chapterId',
    element: (
      <ProtectedRoute roles={['student']} requireActive>
        <S><ChapterPage /></S>
      </ProtectedRoute>
    ),
  },
  {
    path: '/chapters/:chapterId/video',
    element: (
      <ProtectedRoute roles={['student']} requireActive>
        <S><VideoLessonPage /></S>
      </ProtectedRoute>
    ),
  },
  {
    path: '/chapters/:chapterId/grammar',
    element: (
      <ProtectedRoute roles={['student']} requireActive>
        <S><GrammarNotesPage /></S>
      </ProtectedRoute>
    ),
  },
  {
    path: '/chapters/:chapterId/interactive',
    element: (
      <ProtectedRoute roles={['student']} requireActive>
        <S><InteractiveLessonPage /></S>
      </ProtectedRoute>
    ),
  },
  // ── Quiz routes ───────────────────────────────────────────────────────────
  // /quiz/:quizId        → intro screen (shows quiz info, start button)
  // /quiz/:quizId/play   → active quiz question screen
  // /quiz/:quizId/result → score/stars/XP/review after submission
  {
    path: '/quiz/:quizId',
    element: (
      <ProtectedRoute roles={['student']} requireActive>
        <S><QuizIntroPage /></S>
      </ProtectedRoute>
    ),
  },
  {
    path: '/quiz/:quizId/play',
    element: (
      <ProtectedRoute roles={['student']} requireActive>
        <S><QuizPage /></S>
      </ProtectedRoute>
    ),
  },
  {
    path: '/quiz/:quizId/result',
    element: (
      <ProtectedRoute roles={['student']} requireActive>
        <S><QuizResultPage /></S>
      </ProtectedRoute>
    ),
  },
  {
    path: '/progress',
    element: (
      <ProtectedRoute roles={['student']} requireActive>
        <S><MyProgressPage /></S>
      </ProtectedRoute>
    ),
  },
  {
    path: '/leaderboard',
    element: (
      <ProtectedRoute roles={['student']} requireActive>
        <S><LeaderboardPage /></S>
      </ProtectedRoute>
    ),
  },

  // ── Practice Arena routes ─────────────────────────────────────────────────
  // CRITICAL: /practice/... routes go to Practice* components (no progression side effects)
  // /quiz/...   routes go to mastery Quiz* components (progression, XP, stars)
  // These must NEVER be mixed.
  {
    path: '/practice/:quizId',
    element: (
      <ProtectedRoute roles={['student']} requireActive>
        <S><PracticeIntroPage /></S>
      </ProtectedRoute>
    ),
  },
  {
    path: '/practice/:quizId/play',
    element: (
      <ProtectedRoute roles={['student']} requireActive>
        <S><PracticePlayPage /></S>
      </ProtectedRoute>
    ),
  },
  {
    path: '/practice/:quizId/result',
    element: (
      <ProtectedRoute roles={['student']} requireActive>
        <S><PracticeResultPage /></S>
      </ProtectedRoute>
    ),
  },

  {

    path: '/admin',
    element: (
      <ProtectedRoute roles={['admin']}>
        <S><AdminDashboard /></S>
      </ProtectedRoute>
    ),
  },

  // ── 404 ──────────────────────────────────────────────────────────────────
  {
    path: '*',
    element: (
      <div className="min-h-dvh flex items-center justify-center bg-surface-950 text-zinc-400">
        <div className="text-center">
          <p className="text-6xl mb-4">🦁</p>
          <h1 className="font-display font-bold text-2xl text-zinc-100 mb-2">Page Not Found</h1>
          <p className="text-zinc-500 mb-6">Grammo couldn't find this page!</p>
          <a href="/" className="btn-game">Go Home</a>
        </div>
      </div>
    ),
  },
])
