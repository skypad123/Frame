import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

describe('Frame app', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders the empty state initially', () => {
    render(<App />)
    expect(screen.getByText('No frames yet')).toBeInTheDocument()
  })

  it('adds a new frame from the composer', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(
      screen.getByLabelText('Frame title'),
      'Ship the landing page',
    )
    await user.type(
      screen.getByLabelText('Frame details'),
      'Hero + pricing section',
    )
    await user.click(screen.getByRole('button', { name: 'Add frame' }))

    expect(
      screen.getByRole('heading', { name: 'Ship the landing page' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Hero + pricing section')).toBeInTheDocument()
    expect(screen.queryByText('No frames yet')).not.toBeInTheDocument()
    expect(screen.getByText(/1 frame • saved locally/)).toBeInTheDocument()
  })

  it('persists frames to localStorage', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<App />)

    await user.type(screen.getByLabelText('Frame title'), 'Persisted idea')
    await user.click(screen.getByRole('button', { name: 'Add frame' }))
    unmount()

    render(<App />)
    expect(
      screen.getByRole('heading', { name: 'Persisted idea' }),
    ).toBeInTheDocument()
  })

  it('deletes a frame', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('Frame title'), 'Temporary')
    await user.click(screen.getByRole('button', { name: 'Add frame' }))
    expect(
      screen.getByRole('heading', { name: 'Temporary' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Delete Temporary' }))
    expect(
      screen.queryByRole('heading', { name: 'Temporary' }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('No frames yet')).toBeInTheDocument()
  })
})
