import create, { State } from 'zustand'

type ConnectionStatus = 'idle' | 'connected'

interface OneToOneCallStore extends State {
  isOtherPeerConnected: boolean
  setIsOtherPeerConnected: (isOtherPeerConnected: boolean) => void
  isCurrentPeerConnected: boolean
  setIsCurrentPeerConnected: (isCurrentPeerConnected: boolean) => void
  connectionStatus: ConnectionStatus
  setConnectionStatus: (connectionStatus: ConnectionStatus) => void
}

export const useOneToOneCallStore = create<OneToOneCallStore>(set => ({
  isOtherPeerConnected: false,
  setIsOtherPeerConnected: isOtherPeerConnected =>
    set({ isOtherPeerConnected }),
  isCurrentPeerConnected: false,
  setIsCurrentPeerConnected: isCurrentPeerConnected =>
    set({ isCurrentPeerConnected }),
  connectionStatus: 'idle',
  setConnectionStatus: connectionStatus => set({ connectionStatus }),
}))
