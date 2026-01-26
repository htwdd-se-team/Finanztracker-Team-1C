'use client'

import { ApiUserResponseDto } from 'api-client'
import { apiClient, apiClearToken } from '@/api/api-client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useCallback,
} from 'react'
import { toast } from 'sonner'

export type UserContextTypeNotAuthenticated = {
  user: undefined
  isLoading: boolean
  isAuthenticated: false
  logout: () => void
  refetchUser: () => void
}

export type UserContextTypeAuthenticated = {
  user: ApiUserResponseDto
  isLoading: boolean
  isAuthenticated: true
  logout: () => void
  refetchUser: () => void
}

export type UserContextType =
  | UserContextTypeNotAuthenticated
  | UserContextTypeAuthenticated

const UserContext = createContext<UserContextType | undefined>(undefined)

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter()
  const queryClient = useQueryClient()

  const {
    data: user,
    isLoading,
    error,
    refetch: refetchUser,
  } = useQuery({
    queryKey: ['user'],
    queryFn: apiClient.user.userControllerGetCurrentUser,
    select: data => data.data,
    retry: false, // Don't retry user authentication calls
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: prevData => prevData,
  })

  const logout = useCallback(() => {
    apiClearToken()
    queryClient.clear()
    toast.success('Erfolgreich abgemeldet', {
      dismissible: true,
      duration: 3000,
    })
    router.push('/login')
  }, [queryClient, router])

  useEffect(() => {
    // Check if there's an error and it looks like an auth error
    if (error && !isLoading) {
      // Clear invalid token and redirect to login on any user query error
      apiClearToken()
      queryClient.removeQueries({ queryKey: ['user'] })
      router.push('/login')
    }
  }, [error, isLoading, router, queryClient])

  const contextValue: UserContextType = useMemo(() => {
    const isAuthenticated = !!user

    if (isAuthenticated) {
      return {
        user,
        isLoading,
        isAuthenticated: true,
        logout,
        refetchUser,
      } as UserContextTypeAuthenticated
    } else {
      return {
        user: undefined,
        isLoading,
        isAuthenticated: false,
        logout,
        refetchUser,
      } as UserContextTypeNotAuthenticated
    }
  }, [user, isLoading, logout, refetchUser])

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  )
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

// Hook for auth guard functionality
export const useAuthGuard = () => {
  const { isAuthenticated, isLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  return { isAuthenticated, isLoading }
}

// Hook to require authentication - redirects to login if not authenticated
export const useRequireAuth = () => {
  const { isAuthenticated, isLoading, user } = useUser()
  const router = useRouter()

  useEffect(() => {
    // Only redirect if we're not loading and definitely not authenticated
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  return {
    user,
    isLoading,
    isAuthenticated,
  }
}
