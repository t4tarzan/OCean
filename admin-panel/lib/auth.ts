import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { queryPostgres } from './db-connections';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email", placeholder: "user001@ocean.dev" },
        password: { label: "Password", type: "password", placeholder: "001@2026" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const users = await queryPostgres(
            'SELECT id, email, password_hash, name, nickname, role, status FROM platform_users WHERE email = $1',
            [credentials.email]
          );

          if (users.length === 0) {
            return null;
          }

          const user = users[0];

          if (user.status !== 'active') {
            return null;
          }

          // For initial setup, check plain password, then hash it
          if (user.password_hash === credentials.password) {
            // Hash the password for future use
            const hashedPassword = await bcrypt.hash(credentials.password, 10);
            await queryPostgres(
              'UPDATE platform_users SET password_hash = $1 WHERE id = $2',
              [hashedPassword, user.id]
            );
            
            return {
              id: user.id,
              email: user.email,
              name: user.nickname || user.name,
              role: user.role,
            };
          }

          // Check hashed password
          const isValid = await bcrypt.compare(credentials.password, user.password_hash);
          
          if (!isValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.nickname || user.name,
            role: user.role,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || 'ocean-secret-key-change-in-production',
};
