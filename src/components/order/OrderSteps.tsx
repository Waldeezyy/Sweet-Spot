const steps = ["Items", "Review", "Pickup/Delivery", "Date", "Pay"];

export function OrderSteps({ current }: { current: number }) {
  return (
    <div className="mt-6">
      <p className="text-sm font-medium text-[var(--warm-gray)]">Step {current} of {steps.length}</p>
      <div className="mt-2 flex gap-2">
        {steps.map((label, i) => (
          <div key={label} className="flex-1">
            <div className={`h-2 rounded-full ${i + 1 <= current ? "bg-[var(--rose)]" : "bg-[var(--blush)]"}`} />
            <p className="mt-1 hidden text-xs text-[var(--warm-gray)] sm:block">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
