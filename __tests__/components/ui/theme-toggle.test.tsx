import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { ThemeProvider } from '@/components/providers/theme-provider'

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('light', 'dark')
    
    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)' ? false : false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    })
  })

  it('renders a toggle button', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
  })

  it('toggles theme when clicked', async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeToggle />
      </ThemeProvider>
    )

    const button = screen.getByRole('button', { name: /toggle theme/i })
    await user.click(button)

    await waitFor(() => {
      expect(localStorage.getItem('theme')).toBe('dark')
    })
  })

  it('shows moon icon when theme is light', async () => {
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeToggle />
      </ThemeProvider>
    )

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /toggle theme/i })
      // Moon icon should be present (dark mode icon when in light mode)
      expect(button.querySelector('svg')).toBeInTheDocument()
    })
  })

  it('has proper accessibility attributes', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )
    const button = screen.getByRole('button', { name: /toggle theme/i })
    expect(button).toHaveAttribute('aria-label', 'Toggle theme')
  })
})

