import create, { State } from 'zustand'

interface OneToOneCallStore extends State {
  isOtherPeerConnected: boolean
  setIsOtherPeerConnected: (isOtherPeerConnected: boolean) => void
  isCurrentPeerConnected: boolean
  setIsCurrentPeerConnected: (isCurrentPeerConnected: boolean) => void
}

export const useOneToOneCallStore = create<OneToOneCallStore>(set => ({
  isOtherPeerConnected: false,
  setIsOtherPeerConnected: isOtherPeerConnected =>
    set({ isOtherPeerConnected }),
  isCurrentPeerConnected: false,
  setIsCurrentPeerConnected: isCurrentPeerConnected =>
    set({ isCurrentPeerConnected }),
}))
