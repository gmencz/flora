import create, { State } from 'zustand'
import { User } from '@/fauna/auth/login'

interface UserStore extends State {
  user: User | null
  setUser: (user: User) => void
}

export const useUserStore = create<UserStore>(set => ({
  user: null,
  setUser: user => set({ user }),
}))
