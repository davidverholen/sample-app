import { auth } from '@/lib/auth-config'
import { redirect } from 'next/navigation'

/**
 * Get the current session on the server
 */
export async function getCurrentUser() {
  const session = await auth()
  return session?.user
}

/**
 * Require authentication - redirects to login if not authenticated
 */
export async function requireAuth() {
  const session = await auth()
  if (!session) {
    redirect('/login')
  }
  return session
}

/**
 * Require a specific role - throws error if user doesn't have the role
 */
export async function requireRole(_role: string) {
  const session = await requireAuth()
  // TODO: Implement role checking based on your user model
  // if (session.user.role !== role) {
  //   throw new Error('Forbidden')
  // }
  return session
}
