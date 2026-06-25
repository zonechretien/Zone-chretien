import { create } from 'zustand'

export interface Track {
  id: string
  titre: string
  artiste: string
  audioUrl: string
  coverUrl?: string
  duree?: number
}

interface PlayerStore {
  currentTrack: Track | null
  queue: Track[]
  isPlaying: boolean
  volume: number
  currentTime: number
  duration: number
  setTrack: (track: Track) => void
  setQueue: (tracks: Track[], startIndex?: number) => void
  togglePlay: () => void
  setPlaying: (playing: boolean) => void
  setVolume: (volume: number) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  nextTrack: () => void
  prevTrack: () => void
  clearPlayer: () => void
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentTrack: null,
  queue: [],
  isPlaying: false,
  volume: 0.8,
  currentTime: 0,
  duration: 0,

  setTrack: (track) => set({ currentTrack: track, isPlaying: true, currentTime: 0 }),

  setQueue: (tracks, startIndex = 0) => {
    const track = tracks[startIndex]
    set({ queue: tracks, currentTrack: track, isPlaying: true, currentTime: 0 })
  },

  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setPlaying: (playing) => set({ isPlaying: playing }),
  setVolume: (volume) => set({ volume }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),

  nextTrack: () => {
    const { queue, currentTrack } = get()
    if (!currentTrack || queue.length === 0) return
    const idx = queue.findIndex((t) => t.id === currentTrack.id)
    const next = queue[(idx + 1) % queue.length]
    set({ currentTrack: next, currentTime: 0, isPlaying: true })
  },

  prevTrack: () => {
    const { queue, currentTrack } = get()
    if (!currentTrack || queue.length === 0) return
    const idx = queue.findIndex((t) => t.id === currentTrack.id)
    const prev = queue[(idx - 1 + queue.length) % queue.length]
    set({ currentTrack: prev, currentTime: 0, isPlaying: true })
  },

  clearPlayer: () => set({ currentTrack: null, queue: [], isPlaying: false, currentTime: 0 }),
}))
