export default function SelectField({ value, onChange, options, labels = {}, disabled = false }) {
  return (
    <select
      className="h-12 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 disabled:bg-slate-900 disabled:text-slate-500"
      value={value || ""}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {labels[option] || option}
        </option>
      ))}
    </select>
  );
}