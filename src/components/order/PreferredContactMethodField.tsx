import { PREFERRED_CONTACT_OPTIONS } from "@/lib/preferred-contact";

type Props = {
  phone: string;
  value?: string;
  onChange: (value: string) => void;
  name?: string;
  error?: string;
};

export function PreferredContactMethodField({
  phone,
  value,
  onChange,
  name = "preferredContactMethod",
  error,
}: Props) {
  if (!phone.trim()) return null;

  return (
    <div>
      <label className="label" htmlFor={name}>
        Preferred contact method
      </label>
      <p className="mb-2 text-xs text-[var(--warm-gray)]">
        You provided both email and phone — how should Brandy reach you?
      </p>
      <select
        id={name}
        name={name}
        required
        className="input"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select...</option>
        {PREFERRED_CONTACT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
