import { useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

/**
 * AuthProvider listens to Firebase auth state changes and syncs the user
 * profile from the Go backend into the auth store.
 *
 * It does NOT render any UI — it's a pure side-effect hook that should be
 * used in App.tsx to bootstrap the auth state on mount.
 */
export function useAuthProvider() {
  const { setFirebaseUser, setProfile, setLoading, setProfileLoaded, reset } = useAuthStore()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setFirebaseUser(firebaseUser)

        try {
          // Fetch / create the Firestore user profile via Go backend.
          // We send displayName and email so the backend can create the profile on first login.
          const response = await api.post('/auth/profile', {
            email: firebaseUser.email,
            displayName: firebaseUser.displayName ?? firebaseUser.email,
            // studentType defaults to 'independent' — school students will have been
            // pre-provisioned by their teacher/admin and this path won't normally be reached.
            studentType: 'independent',
          })

          setProfile(response.data)
          setProfileLoaded(true)
        } catch (err) {
          console.error('auth: failed to fetch profile', err)
          setProfile(null)
          setProfileLoaded(true)
        }
      } else {
        reset()
        setProfileLoaded(true)
      }

      setLoading(false)
    })

    return unsubscribe
  }, [])
}
