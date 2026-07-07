import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Resend from "next-auth/providers/resend";
import { prisma } from "@/lib/db";

const adminEmail = process.env.ADMIN_EMAIL ?? "bssweetstop25@gmail.com";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  providers: [
    Resend({
      from: process.env.EMAIL_FROM ?? "onboarding@resend.dev",
    }),
  ],
  pages: {
    signIn: "/admin/login",
    verifyRequest: "/admin/login?verify=1",
  },
  callbacks: {
    signIn({ user }) {
      return user.email?.toLowerCase() === adminEmail.toLowerCase();
    },
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});
