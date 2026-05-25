import { Card, CardContent } from "@/components/ui/card";

export default function Metric({ icon, title, value }) {
  return (
    <Card className="rounded-3xl border border-slate-800 bg-slate-900 shadow-sm">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="rounded-2xl bg-slate-800 p-2 text-slate-200">{icon}</div>
        <div>
          <p className="text-xs text-slate-400">{title}</p>
          <p className="text-2xl font-bold leading-none text-white">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}