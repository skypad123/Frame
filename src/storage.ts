import type { FrameNote } from './types'

const STORAGE_KEY = 'frame.notes.v1'

export function loadNotes(): FrameNote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isFrameNote)
  } catch {
    return []
  }
}

export function saveNotes(notes: FrameNote[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
  } catch {
    // Ignore write failures (e.g. storage disabled / quota exceeded).
  }
}

function isFrameNote(value: unknown): value is FrameNote {
  if (typeof value !== 'object' || value === null) return false
  const note = value as Record<string, unknown>
  return (
    typeof note.id === 'string' &&
    typeof note.title === 'string' &&
    typeof note.body === 'string' &&
    typeof note.color === 'string' &&
    typeof note.createdAt === 'number'
  )
}
