import { auth } from "@/lib/auth";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-[var(--cream)]">
      {session?.user ? (
        <>
          <AdminNav email={session.user.email ?? ""} />
          <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
        </>
      ) : (
        children
      )}
    </div>
  );
}
