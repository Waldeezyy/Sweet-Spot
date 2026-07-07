"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Avail = { id: string; date: string; isBlocked: boolean; maxOrders: number };

export function ScheduleManager({ dates }: { dates: Avail[] }) {
  const router = useRouter();
  const [newDate, setNewDate] = useState("");
  const [toast, setToast] = useState("");

  async function blockDate() {
    if (!newDate) return;
    await fetch("/api/admin/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: newDate, isBlocked: true }),
    });
    setToast("Date blocked!");
    setNewDate("");
    router.refresh();
  }

  async function unblock(date: string) {
    await fetch("/api/admin/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, isBlocked: false }),
    });
    router.refresh();
  }

  return (
    <div className="mt-8">
      {toast && <div className="mb-4 rounded-xl bg-[var(--sage)]/20 p-3 text-sm">{toast}</div>}
      <div className="card flex flex-wrap gap-4">
        <div>
          <label className="label">Block a date</label>
          <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="input" />
        </div>
        <button type="button" onClick={blockDate} className="btn-primary self-end">Block Date</button>
      </div>
      <div className="mt-8 space-y-2">
        {dates.filter((d) => d.isBlocked).map((d) => (
          <div key={d.id} className="card flex justify-between">
            <span>{d.date}</span>
            <button type="button" onClick={() => unblock(d.date)} className="text-sm text-[var(--rose)]">Unblock</button>
          </div>
        ))}
        {dates.filter((d) => d.isBlocked).length === 0 && (
          <p className="text-sm text-[var(--warm-gray)]">No blocked dates.</p>
        )}
      </div>
    </div>
  );
}
