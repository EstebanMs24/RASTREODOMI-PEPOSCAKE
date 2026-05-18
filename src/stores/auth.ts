import { create } from 'zustand'
import { supabase } from '@/config/supabase'
import { User } from '@/types'

interface AuthState {
  user: User | null
  session: any | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (email: string, password: string, fullName: string) => Promise<void>
  fetchUser: () => Promise<void>
  setUser: (user: User | null) => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      set({ session: data.session })

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (userError) throw userError

      set({ user: userData, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  logout: async () => {
    set({ loading: true })
    try {
      await supabase.auth.signOut()
      set({ user: null, session: null, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  register: async (email: string, password: string, fullName: string) => {
    set({ loading: true, error: null })
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) throw authError

      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user!.id,
            email,
            full_name: fullName,
            role: 'deliverer',
          },
        ])
        .select()
        .single()

      if (userError) throw userError

      set({ user: userData, session: authData.session, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  fetchUser: async () => {
    set({ loading: true })
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) throw sessionError

      if (!session) {
        set({ user: null, session: null, loading: false })
        return
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (userError) throw userError

      set({ user: userData, session, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  setUser: (user: User | null) => {
    set({ user })
  },

  clearError: () => {
    set({ error: null })
  },
}))
