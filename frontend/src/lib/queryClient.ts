import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale after 5 minutes — curriculum data doesn't change often
      staleTime: 5 * 60 * 1000,
      // Retry once on failure
      retry: 1,
      // Don't refetch on window focus in a quiz session (prevents disruption)
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})
