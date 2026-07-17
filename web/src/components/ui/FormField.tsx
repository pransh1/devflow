export default function FormField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <label className="mb-1 block text-xs text-zinc-400">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-zinc-600">{hint}</p>}
    </div>
  );
}