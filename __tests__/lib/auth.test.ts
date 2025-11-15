import { getCurrentUser, requireAuth, requireRole } from '@/lib/auth'
import { auth } from '@/lib/auth-config'
import { redirect } from 'next/navigation'

// Mock dependencies
jest.mock('@/lib/auth-config', () => ({
  auth: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

describe('Auth utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getCurrentUser', () => {
    it('returns user when session exists', async () => {
      const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' }
      ;(auth as jest.Mock).mockResolvedValue({ user: mockUser })

      const user = await getCurrentUser()
      expect(user).toEqual(mockUser)
      expect(auth).toHaveBeenCalledTimes(1)
    })

    it('returns undefined when session does not exist', async () => {
      ;(auth as jest.Mock).mockResolvedValue(null)

      const user = await getCurrentUser()
      expect(user).toBeUndefined()
      expect(auth).toHaveBeenCalledTimes(1)
    })

    it('returns undefined when session user is undefined', async () => {
      ;(auth as jest.Mock).mockResolvedValue({ user: undefined })

      const user = await getCurrentUser()
      expect(user).toBeUndefined()
    })
  })

  describe('requireAuth', () => {
    it('returns session when authenticated', async () => {
      const mockSession = {
        user: { id: '1', email: 'test@example.com' },
        expires: '2024-12-31',
      }
      ;(auth as jest.Mock).mockResolvedValue(mockSession)

      const session = await requireAuth()
      expect(session).toEqual(mockSession)
      expect(redirect).not.toHaveBeenCalled()
    })

    it('redirects to login when not authenticated', async () => {
      ;(auth as jest.Mock).mockResolvedValue(null)

      await requireAuth()
      expect(redirect).toHaveBeenCalledWith('/login')
    })
  })

  describe('requireRole', () => {
    it('returns session when user has required role', async () => {
      const mockSession = {
        user: { id: '1', email: 'test@example.com' },
        expires: '2024-12-31',
      }
      ;(auth as jest.Mock).mockResolvedValue(mockSession)

      const session = await requireRole('admin')
      expect(session).toEqual(mockSession)
      expect(redirect).not.toHaveBeenCalled()
    })

    it('calls requireAuth internally', async () => {
      const mockSession = {
        user: { id: '1', email: 'test@example.com' },
        expires: '2024-12-31',
      }
      ;(auth as jest.Mock).mockResolvedValue(mockSession)

      await requireRole('admin')
      expect(auth).toHaveBeenCalled()
    })
  })
})
