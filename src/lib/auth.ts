import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const adminEmail = process.env.ADMIN_EMAIL ?? "bssweetstop25@gmail.com";
const adminPassword = process.env.ADMIN_PASSWORD;

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize(credentials) {
        if (!adminPassword) {
          console.error("ADMIN_PASSWORD is not set");
          return null;
        }

        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (
          email?.toLowerCase() === adminEmail.toLowerCase() &&
          password === adminPassword
        ) {
          return { id: "admin", email: adminEmail, name: "Brandy" };
        }

        return null;
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
