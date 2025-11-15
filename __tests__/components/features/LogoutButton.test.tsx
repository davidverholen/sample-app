import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LogoutButton } from '@/components/features/LogoutButton'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

// Mock Next.js modules
jest.mock('next-auth/react', () => ({
  signOut: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

describe('LogoutButton', () => {
  const mockPush = jest.fn()
  const mockRefresh = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    })
    ;(signOut as jest.Mock).mockResolvedValue(undefined)
  })

  it('renders a sign out button', () => {
    render(<LogoutButton />)
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })

  it('calls signOut when clicked', async () => {
    const user = userEvent.setup()
    render(<LogoutButton />)

    await user.click(screen.getByRole('button', { name: /sign out/i }))
    expect(signOut).toHaveBeenCalledWith({ redirect: false })
  })

  it('redirects to login after sign out', async () => {
    const user = userEvent.setup()
    render(<LogoutButton />)

    await user.click(screen.getByRole('button', { name: /sign out/i }))
    
    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 0))
    
    expect(mockPush).toHaveBeenCalledWith('/login')
    expect(mockRefresh).toHaveBeenCalled()
  })

  it('uses outline variant', () => {
    render(<LogoutButton />)
    const button = screen.getByRole('button', { name: /sign out/i })
    expect(button).toHaveClass('border')
  })
})

