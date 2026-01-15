import NextAuth, { NextAuthOptions, User as NextAuthUser } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { authenticateUser } from '@/lib/auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      username: string
      name: string | null
      avatar: string | null
      role: string
    }
  }

  interface User {
    id: string
    email: string
    username: string
    name: string | null
    avatar: string | null
    role: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    username: string
    role: string
    avatar: string | null
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<NextAuthUser | null> {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await authenticateUser(credentials.email, credentials.password)

        if (!user) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = user.username
        token.role = user.role
        token.avatar = user.avatar
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.username = token.username
        session.user.role = token.role
        session.user.avatar = token.avatar
      }
      return session
    },
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
