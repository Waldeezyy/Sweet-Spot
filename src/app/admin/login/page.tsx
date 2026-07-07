"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const params = useSearchParams();
  const verify = params.get("verify");

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Admin Login</h1>
      {verify ? (
        <p className="mt-4 text-[var(--warm-gray)]">Check your email for a sign-in link.</p>
      ) : (
        <>
          <p className="mt-2 text-[var(--warm-gray)]">Enter the admin email to receive a magic link.</p>
          <p className="mt-1 text-xs text-[var(--warm-gray)]">
            Only the email set in ADMIN_EMAIL can sign in. Requires RESEND_API_KEY on the server.
          </p>
          <form
            className="card mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const email = new FormData(e.currentTarget).get("email") as string;
              signIn("resend", { email, callbackUrl: "/admin" });
            }}
          >
            <div>
              <label className="label">Email</label>
              <input name="email" type="email" required className="input" defaultValue="bssweetstop25@gmail.com" />
            </div>
            <button type="submit" className="btn-primary w-full">Send Magic Link</button>
          </form>
        </>
      )}
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
