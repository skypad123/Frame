import { useEffect, useMemo, useState } from 'react'
import type { FrameColor, FrameNote } from './types'
import { loadNotes, saveNotes } from './storage'
import './App.css'

const COLORS: FrameColor[] = ['indigo', 'pink', 'emerald', 'amber']

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export default function App() {
  const [notes, setNotes] = useState<FrameNote[]>(() => loadNotes())
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [color, setColor] = useState<FrameColor>('indigo')

  useEffect(() => {
    saveNotes(notes)
  }, [notes])

  const canAdd = title.trim().length > 0

  const sortedNotes = useMemo(
    () => [...notes].sort((a, b) => b.createdAt - a.createdAt),
    [notes],
  )

  function addNote() {
    if (!canAdd) return
    const note: FrameNote = {
      id: createId(),
      title: title.trim(),
      body: body.trim(),
      color,
      createdAt: Date.now(),
    }
    setNotes((prev) => [note, ...prev])
    setTitle('')
    setBody('')
  }

  function removeNote(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <div className="app">
      <header className="app__header">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true" />
          <h1 className="brand__name">Frame</h1>
        </div>
        <p className="app__tagline">Capture ideas and give each one a frame.</p>
      </header>

      <section className="composer" aria-label="Create a frame">
        <input
          className="composer__title"
          placeholder="Give your idea a title…"
          aria-label="Frame title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addNote()
          }}
        />
        <textarea
          className="composer__body"
          placeholder="Add a few details (optional)…"
          aria-label="Frame details"
          rows={2}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <div className="composer__row">
          <div className="swatches" role="group" aria-label="Frame color">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`swatch swatch--${c} ${
                  c === color ? 'swatch--active' : ''
                }`}
                aria-label={c}
                aria-pressed={c === color}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
          <button
            type="button"
            className="btn btn--primary"
            onClick={addNote}
            disabled={!canAdd}
          >
            Add frame
          </button>
        </div>
      </section>

      <section className="board" aria-label="Your frames">
        {sortedNotes.length === 0 ? (
          <div className="empty">
            <p className="empty__title">No frames yet</p>
            <p className="empty__hint">
              Your first idea is waiting — add a title above and hit “Add frame”.
            </p>
          </div>
        ) : (
          <ul className="grid">
            {sortedNotes.map((note) => (
              <li key={note.id} className={`card card--${note.color}`}>
                <div className="card__head">
                  <h2 className="card__title">{note.title}</h2>
                  <button
                    type="button"
                    className="card__delete"
                    aria-label={`Delete ${note.title}`}
                    onClick={() => removeNote(note.id)}
                  >
                    ×
                  </button>
                </div>
                {note.body && <p className="card__body">{note.body}</p>}
                <time className="card__time">
                  {new Date(note.createdAt).toLocaleString()}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="app__footer">
        <span>
          {notes.length} {notes.length === 1 ? 'frame' : 'frames'} • saved locally
        </span>
      </footer>
    </div>
  )
}
