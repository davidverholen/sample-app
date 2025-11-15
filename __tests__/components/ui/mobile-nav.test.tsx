import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MobileNav } from '@/components/ui/mobile-nav'

describe('MobileNav', () => {
  beforeEach(() => {
    document.body.style.overflow = ''
  })

  afterEach(() => {
    document.body.style.overflow = ''
  })

  it('renders menu button', () => {
    render(<MobileNav />)
    expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument()
  })

  it('toggles menu when button is clicked', async () => {
    const user = userEvent.setup()
    render(<MobileNav />)

    const button = screen.getByRole('button', { name: /open menu/i })
    await user.click(button)

    expect(screen.getByRole('button', { name: /close menu/i })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: /mobile navigation/i })).toBeInTheDocument()
  })

  it('closes menu when backdrop is clicked', async () => {
    const user = userEvent.setup()
    render(<MobileNav />)

    // Open menu
    await user.click(screen.getByRole('button', { name: /open menu/i }))
    expect(screen.getByRole('navigation')).toBeInTheDocument()

    // Click backdrop
    const backdrop = document.querySelector('[aria-hidden="true"]')
    if (backdrop) {
      await user.click(backdrop)
      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    }
  })

  it('renders children when menu is open', async () => {
    const user = userEvent.setup()
    render(
      <MobileNav>
        <a href="/test">Test Link</a>
      </MobileNav>
    )

    await user.click(screen.getByRole('button', { name: /open menu/i }))
    expect(screen.getByRole('link', { name: /test link/i })).toBeInTheDocument()
  })

  it('has proper accessibility attributes', async () => {
    const user = userEvent.setup()
    render(<MobileNav />)

    const button = screen.getByRole('button', { name: /open menu/i })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(button).toHaveAttribute('aria-controls', 'mobile-nav')

    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
  })

  it('locks body scroll when menu is open', async () => {
    const user = userEvent.setup()
    render(<MobileNav />)

    await user.click(screen.getByRole('button', { name: /open menu/i }))
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('unlocks body scroll when menu is closed', async () => {
    const user = userEvent.setup()
    render(<MobileNav />)

    const button = screen.getByRole('button', { name: /open menu/i })
    await user.click(button)
    await user.click(button)

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(document.body.style.overflow).toBe('')
  })
})
