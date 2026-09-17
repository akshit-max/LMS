import { create } from 'zustand'
import type { User as FirebaseUser } from 'firebase/auth'
import type { User, UserRole } from '@/types'

interface AuthState {
  // Firebase auth user (for token access)
  firebaseUser: FirebaseUser | null
  // Our Firestore user profile (role, status, etc.)
  profile: User | null
  // Auth loading state (while Firebase restores session)
  isLoading: boolean
  // Whether profile has been fetched from the backend
  profileLoaded: boolean

  // Actions
  setFirebaseUser: (user: FirebaseUser | null) => void
  setProfile: (profile: User | null) => void
  setLoading: (loading: boolean) => void
  setProfileLoaded: (loaded: boolean) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  firebaseUser: null,
  profile: null,
  isLoading: true,
  profileLoaded: false,

  setFirebaseUser: (user) => set({ firebaseUser: user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
  setProfileLoaded: (profileLoaded) => set({ profileLoaded }),
  reset: () => set({
    firebaseUser: null,
    profile: null,
    isLoading: false,
    profileLoaded: false,
  }),
}))

// Selector helpers
export const useRole = (): UserRole | null =>
  useAuthStore((s) => s.profile?.role ?? null)

export const useIsAdmin = () =>
  useAuthStore((s) => s.profile?.role === 'admin')

export const useIsStudent = () =>
  useAuthStore((s) => s.profile?.role === 'student')

export const useAccountStatus = () =>
  useAuthStore((s) => s.profile?.accountStatus ?? null)

export const useIsActive = () =>
  useAuthStore((s) => s.profile?.accountStatus === 'active')
