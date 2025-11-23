/* eslint-disable @typescript-eslint/no-explicit-any */
import CredentialsProvider from 'next-auth/providers/credentials'
import crypto from 'crypto'
import localDb from './localDb'
import type { AuthOptions } from 'next-auth'

// Using a local JSON-backed DB instead of Convex for quick-and-dirty NoSQL.

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        name: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.name || !credentials?.password) return null

        try {
          const user = await localDb.getUserByName(credentials.name)
          if (!user) return null

          const hash = crypto.pbkdf2Sync(credentials.password, user.salt, 310000, 32, 'sha256').toString('hex')
          if (hash !== user.passwordHash) return null

          return {
            id: String((user as any).id),
            name: (user as any).name,
            email: (user as any).email || null,
            image: null,
          }
        } catch (e) {
          console.error('Auth error:', e)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt' as const,
  },
  callbacks: {
    async jwt({ token, user }: any) {
      // On initial sign in, persist user.id onto the token so it is available in session
      if (user?.id) token.id = user.id
      return token
    },
    async session({ session, token }: any) {
      // expose token.id on session.user.id
      if (token?.id) {
        session.user = session.user || {}
        ;(session.user as any).id = token.id
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export default authOptions
