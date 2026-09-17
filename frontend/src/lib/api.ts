import axios from 'axios'
import { auth } from './firebase'

// Axios instance that automatically attaches Firebase ID tokens to every request.
// The Go backend verifies this token via Firebase Admin SDK.
const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor: attach fresh Firebase ID token to all outgoing requests
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser
    if (user) {
      const token = await user.getIdToken()
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor: handle 401s globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — sign out and redirect to login
      auth.signOut()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default api
