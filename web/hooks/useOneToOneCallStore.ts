import create, { State } from 'zustand'

type Peers = [string | null, string | null]

interface OneToOneCallStore extends State {
  peers: Peers
  setPeers: (peers: Peers) => void
}

export const useOneToOneCallStore = create<OneToOneCallStore>(set => ({
  peers: [null, null],
  setPeers: peers => set({ peers }),
}))
