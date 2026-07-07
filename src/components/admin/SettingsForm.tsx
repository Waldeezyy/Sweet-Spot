"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Settings = {
  businessName: string;
  tagline: string | null;
  aboutText: string;
  contactEmail: string;
  location: string;
  orderMinimumCents: number;
  depositPercent: number;
  leadTimeDays: number;
  deliveryRadiusMiles: number;
  deliveryFeeCents: number;
  pickupInstructions: string;
  deliveryNote: string;
  allergyNote: string;
};

export function SettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [form, setForm] = useState(settings);
  const [toast, setToast] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setToast("Settings saved!");
    router.refresh();
  }

  return (
    <form onSubmit={handleSave} className="card mt-8 space-y-4">
      {toast && <div className="rounded-xl bg-[var(--sage)]/20 p-3 text-sm">{toast}</div>}
      <div>
        <label className="label">Business name</label>
        <input className="input" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
      </div>
      <div>
        <label className="label">Tagline</label>
        <input className="input" value={form.tagline ?? ""} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
      </div>
      <div>
        <label className="label">About text</label>
        <textarea className="input min-h-[160px]" value={form.aboutText} onChange={(e) => setForm({ ...form, aboutText: e.target.value })} />
      </div>
      <div>
        <label className="label">Contact email</label>
        <input type="email" className="input" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label">Order minimum ($)</label>
          <input type="number" step="0.01" className="input" value={(form.orderMinimumCents / 100).toFixed(2)} onChange={(e) => setForm({ ...form, orderMinimumCents: Math.round(parseFloat(e.target.value) * 100) })} />
        </div>
        <div>
          <label className="label">Deposit %</label>
          <input type="number" className="input" value={form.depositPercent} onChange={(e) => setForm({ ...form, depositPercent: Number(e.target.value) })} />
        </div>
        <div>
          <label className="label">Lead time (days)</label>
          <input type="number" className="input" value={form.leadTimeDays} onChange={(e) => setForm({ ...form, leadTimeDays: Number(e.target.value) })} />
        </div>
      </div>
      <div>
        <label className="label">Pickup instructions</label>
        <textarea className="input" value={form.pickupInstructions} onChange={(e) => setForm({ ...form, pickupInstructions: e.target.value })} />
      </div>
      <div>
        <label className="label">Delivery note</label>
        <textarea className="input" value={form.deliveryNote} onChange={(e) => setForm({ ...form, deliveryNote: e.target.value })} />
      </div>
      <button type="submit" className="btn-primary">Save changes</button>
    </form>
  );
}
