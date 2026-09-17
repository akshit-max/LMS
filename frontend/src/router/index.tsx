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

// Admin pages
const AdminDashboard = lazy(() => import('@/features/admin/AdminDashboard'))

// ─── Loading fallback ─────────────────────────────────────────────────────────

function PageLoader() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-surface-950">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
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

  // ── Admin routes ──────────────────────────────────────────────────────────
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
