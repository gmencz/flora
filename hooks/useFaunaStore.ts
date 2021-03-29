import create, { State } from 'zustand'

interface FaunaStore extends State {
  accessToken: string
  setAccessToken: (newAccessToken: string) => void
}

export const useFaunaStore = create<FaunaStore>(set => ({
  accessToken: '',
  setAccessToken: (newAccessToken: string) =>
    set({ accessToken: newAccessToken }),
}))
