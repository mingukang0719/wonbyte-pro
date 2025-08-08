import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { signUp as customSignUp, signIn as customSignIn, signOut as customSignOut, getCurrentUser } from '../services/customAuth'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // 현재 세션 확인
    checkSession()
  }, [])

  const checkSession = async () => {
    console.log('AuthContext: Checking session...')
    try {
      const { user: currentUser } = await getCurrentUser()
      console.log('AuthContext: getCurrentUser result:', currentUser)
      if (currentUser) {
        setUser(currentUser)
        setProfile(currentUser)
        console.log('AuthContext: User set successfully')
      } else {
        console.log('AuthContext: No user found')
      }
    } catch (error) {
      console.error('Session check error:', error)
    } finally {
      setLoading(false)
      console.log('AuthContext: Loading set to false')
    }
  }

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) throw error
      
      if (data) {
        setProfile(data)
      }
    } catch (error) {
      console.error('Profile fetch error:', error)
    }
  }

  const signUp = async (formData) => {
    try {
      const { user, error } = await customSignUp({
        username: formData.username,
        password: formData.password,
        email: formData.email,
        fullName: formData.full_name,
        role: formData.role || 'student',
        gradeLevel: formData.grade_level,
        schoolName: formData.school_name,
        phoneNumber: formData.phone_number
      })

      if (error) throw error

      return { data: user, error: null }
    } catch (error) {
      console.error('Signup error:', error)
      return { data: null, error }
    }
  }

  const signIn = async ({ username, password }) => {
    try {
      const { user, session, error } = await customSignIn({
        username,
        password
      })

      if (error) throw error

      if (user) {
        setUser(user)
        setProfile(user)
      }

      return { data: { user, session }, error: null }
    } catch (error) {
      console.error('Login error:', error)
      return { data: null, error }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await customSignOut()
      if (error) throw error
      
      setUser(null)
      setProfile(null)
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      
      if (error) throw error
      
      return { error: null }
    } catch (error) {
      console.error('Password reset error:', error)
      return { error }
    }
  }

  const updateProfile = async (updates) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      setProfile(data)
      return { data, error: null }
    } catch (error) {
      console.error('Profile update error:', error)
      return { data: null, error }
    }
  }

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id)
    }
  }

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    refreshProfile,
    isAuthenticated: !!user,
    isStudent: profile?.role === 'student',
    isTeacher: profile?.role === 'teacher',
    isParent: profile?.role === 'parent',
    isAdmin: profile?.role === 'admin'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}