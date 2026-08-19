export type FrameColor = 'indigo' | 'pink' | 'emerald' | 'amber'

export interface FrameNote {
  id: string
  title: string
  body: string
  color: FrameColor
  createdAt: number
}
