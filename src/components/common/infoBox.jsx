export default function InfoBox({ title, text, small = false }) {
  return (
    <div className={`rounded-2xl border border-slate-800 bg-slate-950 ${small ? "mt-2 p-2" : "p-3"}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-1 text-sm text-slate-300">{text}</p>
    </div>
  );
}