import Section from "../common/Section";
import { daysUntil } from "../../utils/dateUtils";

export default function KpiPanel({ tasks }) {
  const open = tasks.filter((task) => task.status !== "Concluído");
  const done = tasks.filter((task) => task.status === "Concluído");
  const late = open.filter((task) => daysUntil(task.endDate) < 0);
  const dueSoon = open.filter((task) => daysUntil(task.endDate) >= 0 && daysUntil(task.endDate) <= 3);
  const high = open.filter((task) => task.priority === "Alta");
  const completion = tasks.length ? Math.round((done.length / tasks.length) * 100) : 0;

  return (
    <Section title="KPIs automáticos">
      <div className="grid grid-cols-2 gap-3">
        <KpiCard title="Conclusão" value={`${completion}%`} detail={`${done.length}/${tasks.length} concluídas`} />
        <KpiCard title="Atrasadas" value={late.length} detail="fora do prazo" />
        <KpiCard title="Próx. 3 dias" value={dueSoon.length} detail="vencendo" />
        <KpiCard title="Alta prioridade" value={high.length} detail="ações críticas" />
      </div>
    </Section>
  );
}

function KpiCard({ title, value, detail }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
      <p className="text-xs text-slate-400">{title}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-slate-500">{detail}</p>
    </div>
  );
}