// Avatar com iniciais e cor derivada do nome (zero dependências).
const COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500",
  "bg-rose-500", "bg-sky-500", "bg-indigo-500", "bg-teal-500", "bg-orange-500",
];

function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function initials(name) {
  const parts = String(name || "").trim().split(/[\s@.]+/).filter(Boolean);
  if (!parts.length) return "?";
  return ((parts[0][0] || "") + (parts[1]?.[0] || "")).toUpperCase();
}

export default function Avatar({ name, size = 24, className = "" }) {
  const color = COLORS[hashStr(String(name || "?")) % COLORS.length];
  return (
    <span
      title={name}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white ${color} ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
    >
      {initials(name)}
    </span>
  );
}

export function AvatarStack({ names = [], size = 22, max = 3, className = "" }) {
  const shown = names.slice(0, max);
  const extra = names.length - shown.length;
  return (
    <span className={`flex items-center ${className}`}>
      {shown.map((n, i) => (
        <span key={`${n}-${i}`} style={{ marginLeft: i ? -6 : 0 }} className="rounded-full ring-2 ring-slate-900">
          <Avatar name={n} size={size} />
        </span>
      ))}
      {extra > 0 && (
        <span
          style={{ marginLeft: -6, width: size, height: size, fontSize: Math.round(size * 0.38) }}
          className="inline-flex items-center justify-center rounded-full bg-slate-700 font-bold text-slate-200 ring-2 ring-slate-900"
        >
          +{extra}
        </span>
      )}
    </span>
  );
}
