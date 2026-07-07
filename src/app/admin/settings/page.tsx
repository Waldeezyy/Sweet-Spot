import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { SettingsForm } from "@/components/admin/SettingsForm";

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  const settings = await prisma.shopSettings.findFirst();
  if (!settings) redirect("/admin");

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Shop Settings</h1>
      <SettingsForm settings={settings} />
    </div>
  );
}
