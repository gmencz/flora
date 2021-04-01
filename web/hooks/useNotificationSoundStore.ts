import create, { State } from 'zustand'

interface PlayOptions {
  loop: boolean
}

interface NotificationSoundStore extends State {
  audio: HTMLAudioElement | null
  play: (src: string, options?: Partial<PlayOptions>) => void
  stop: () => void
}

export const useNotificationSoundStore = create<NotificationSoundStore>(
  (set, get) => ({
    audio: null,
    play: (src, options) => {
      // Stop the current audio if there's any
      get().stop()
      const audio = new Audio(src)

      if (options?.loop) {
        audio.loop = true
      }

      audio.play()
      set({ audio })
    },
    stop: () => {
      const audio = get().audio
      if (!audio) {
        return
      }

      audio.pause()
      audio.currentTime = 0
      audio.src = ''
    },
  }),
)
