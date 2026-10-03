import { idleChoice, selectedChoice } from "./styles";

export function Section({
  step,
  title,
  disabled,
  children,
}: {
  step: number;
  title: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-lg border border-zinc-200 p-4 md:p-5 dark:border-zinc-800 ${disabled ? "opacity-40" : ""}`}
      inert={disabled}
    >
      <h2 className="mb-4 flex items-center gap-3 font-medium">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
          {step}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="block text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}

export function Choice<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Record<T, string>;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {(Object.keys(options) as T[]).map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => onChange(k)}
          className={`rounded-md border px-3 py-1.5 text-sm ${
            value === k
              ? selectedChoice
              : idleChoice
          }`}
        >
          {options[k]}
        </button>
      ))}
    </div>
  );
}
