import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

// ─── helpers ────────────────────────────────────────────────────────────────

function groupByHour(records) {
  const map = {};
  records.forEach((item) => {
    const hour = item.time?.slice(0, 2) || "--";
    if (!map[hour]) map[hour] = { hora: `${hour}h`, OK: 0, NOK: 0, Total: 0 };
    map[hour][item.result] += 1;
    map[hour].Total += 1;
  });
  return Object.values(map).sort((a, b) => a.hora.localeCompare(b.hora));
}

function cumulativeProduction(records) {
  const map = {};
  records.forEach((item) => {
    const hour = item.time?.slice(0, 2);
    if (!hour) return;
    if (!map[hour]) map[hour] = 0;
    map[hour] += 1;
  });
  let running = 0;
  return Object.keys(map)
    .sort()
    .map((hour) => {
      running += map[hour];
      return { hora: `${hour}h`, total: running };
    });
}

function groupByProduct(records) {
  const map = {};
  records.forEach((item) => {
    const product = item.product || item.partNumber || "Sem produto";
    if (!map[product])
      map[product] = { product, partNumber: item.partNumber, total: 0, ok: 0, nok: 0 };
    map[product].total += 1;
    if (item.result === "OK") map[product].ok += 1;
    else map[product].nok += 1;
  });
  return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 8);
}

function groupByLot(records) {
  const map = {};
  records.forEach((item) => {
    const lot = item.productionOrder || "Sem lote";
    if (!map[lot]) map[lot] = { lot, total: 0, ok: 0, nok: 0 };
    map[lot].total += 1;
    if (item.result === "OK") map[lot].ok += 1;
    else map[lot].nok += 1;
  });
  return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 6);
}

function groupByEquipment(records) {
  const map = {};
  records.forEach((item) => {
    const equipment = item.equipment || "Sem equipamento";
    if (!map[equipment]) map[equipment] = { equipment, total: 0, ok: 0, nok: 0 };
    map[equipment].total += 1;
    if (item.result === "OK") map[equipment].ok += 1;
    else map[equipment].nok += 1;
  });
  return Object.values(map).sort((a, b) => b.total - a.total);
}

function groupByShift(records) {
  const result = {
    "1º turno": { total: 0, ok: 0, nok: 0, range: "06h – 14h" },
    "2º turno": { total: 0, ok: 0, nok: 0, range: "14h – 22h" },
    "Fora de turno": { total: 0, ok: 0, nok: 0, range: "00h – 06h" },
  };
  records.forEach((item) => {
    const shift = item.shift || "Fora de turno";
    if (!result[shift]) result[shift] = { total: 0, ok: 0, nok: 0, range: "" };
    result[shift].total += 1;
    if (item.result === "OK") result[shift].ok += 1;
    else result[shift].nok += 1;
  });
  return result;
}

function groupByDate(records) {
  const map = {};
  records.forEach((item) => {
    const date = item.date || "--";
    if (!map[date]) map[date] = { date, OK: 0, NOK: 0 };
    if (item.result === "OK") map[date].OK += 1;
    else map[date].NOK += 1;
  });
  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
}

function groupNokPareto(records) {
  const map = {};
  records
    .filter((item) => item.result === "NOK")
    .forEach((item) => {
      const key = item.product || item.partNumber || "Sem produto";
      if (!map[key]) map[key] = { name: key, total: 0 };
      map[key].total += 1;
    });
  return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 5);
}

function pct(ok, total) {
  return total ? Math.round((ok / total) * 100) : 0;
}

// ─── sub-components ──────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <p className="text-[10px] font-medium tracking-widest text-slate-500 uppercase mb-2">
      {children}
    </p>
  );
}

function BarTrack({ value, color = "bg-cyan-400" }) {
  return (
    <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
    </div>
  );
}

function Pill({ children, color }) {
  const colors = {
    green: "bg-emerald-500/10 text-emerald-300",
    red: "bg-red-500/10 text-red-300",
    blue: "bg-cyan-500/10 text-cyan-300",
    amber: "bg-orange-500/10 text-orange-300",
  };
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${colors[color]}`}>
      {children}
    </span>
  );
}

function MetaCard({ total, target }) {
  const targetPct = target ? Math.min(Math.round((total / target) * 100), 100) : 0;
  const remaining = Math.max(target - total, 0);
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <SectionLabel>Meta de produção</SectionLabel>
      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="text-2xl font-bold text-white">{total.toLocaleString("pt-BR")}</p>
          <p className="text-[11px] text-slate-400">produzido hoje</p>
        </div>
        <div className="text-right">
          <p className="text-base font-semibold text-slate-300">
            {target.toLocaleString("pt-BR")}
          </p>
          <p className="text-[11px] text-slate-500">meta do dia</p>
        </div>
      </div>
      <BarTrack value={targetPct} color="bg-emerald-400" />
      <p className="mt-1.5 text-[11px] text-slate-400">
        {targetPct}% da meta atingida
        {remaining > 0 && ` — faltam ${remaining.toLocaleString("pt-BR")} peças`}
      </p>
    </div>
  );
}

function ShiftCard({ name, data }) {
  const shiftPct = pct(data.ok, data.total);
  return (
    <div className="rounded-2xl bg-slate-950 p-3">
      <p className="text-xs font-semibold text-white">{name}</p>
      {data.range && <p className="text-[10px] text-slate-500 mt-0.5">{data.range}</p>}
      <p className="text-lg font-bold text-white mt-2">{data.total.toLocaleString("pt-BR")}</p>
      <div className="flex flex-wrap gap-1.5 mt-2">
        <Pill color="green">OK {data.ok}</Pill>
        <Pill color="red">NOK {data.nok}</Pill>
        <Pill color="blue">{shiftPct}%</Pill>
      </div>
    </div>
  );
}

function EquipmentRow({ item }) {
  const equipPct = pct(item.ok, item.total);
  return (
    <div className="py-2.5 border-b border-slate-800 last:border-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-semibold text-white">{item.equipment}</span>
        <span className="text-sm font-bold text-cyan-300">{equipPct}%</span>
      </div>
      <BarTrack value={equipPct} color="bg-cyan-400" />
      <p className="mt-1 text-[10px] text-slate-500">
        Total {item.total} · OK {item.ok} · NOK {item.nok}
      </p>
    </div>
  );
}

function ProductRow({ item }) {
  const prodPct = pct(item.ok, item.total);
  return (
    <div className="py-2.5 border-b border-slate-800 last:border-0">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{item.product}</p>
          {item.partNumber && (
            <p className="text-[10px] text-slate-500">{item.partNumber}</p>
          )}
          <div className="mt-1.5">
            <BarTrack value={prodPct} color="bg-cyan-400" />
          </div>
          <p className="mt-1 text-[10px] text-slate-500">
            OK {item.ok} · NOK {item.nok} · FPY {prodPct}%
          </p>
        </div>
        <span className="text-sm font-bold text-white shrink-0">
          {item.total.toLocaleString("pt-BR")}
        </span>
      </div>
    </div>
  );
}

function LotRow({ item }) {
  const lotPct = pct(item.ok, item.total);
  return (
    <div className="py-2.5 border-b border-slate-800 last:border-0">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">Lote {item.lot}</p>
          <div className="mt-1.5">
            <BarTrack value={lotPct} color="bg-orange-400" />
          </div>
          <p className="mt-1 text-[10px] text-slate-500">
            OK {item.ok} · NOK {item.nok} · FPY {lotPct}%
          </p>
        </div>
        <span className="text-sm font-bold text-white shrink-0">
          {item.total.toLocaleString("pt-BR")}
        </span>
      </div>
    </div>
  );
}

function ParetoRow({ item, max }) {
  const width = Math.round((item.total / max) * 100);
  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className="text-xs text-white w-24 shrink-0 truncate">{item.name}</span>
      <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div className="h-full rounded-full bg-red-400" style={{ width: `${width}%` }} />
      </div>
      <span className="text-xs font-bold text-red-300 min-w-[24px] text-right">
        {item.total}
      </span>
    </div>
  );
}

// ─── chart hook ──────────────────────────────────────────────────────────────

function useChart(ref, config) {
  const dataKey = JSON.stringify(
    config.data.datasets.map((d) => ({ label: d.label, data: d.data }))
  );
  useEffect(() => {
    if (!ref.current) return;
    const chart = new Chart(ref.current, config);
    return () => chart.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataKey]);
}

const GRID = "rgba(148,163,184,.1)";
const TICK = { color: "#64748b", font: { size: 10 } };

function HourChart({ data }) {
  const ref = useRef(null);
  useChart(ref, {
    type: "bar",
    data: {
      labels: data.map((d) => d.hora),
      datasets: [
        { label: "OK", data: data.map((d) => d.OK), backgroundColor: "#1D9E75", borderRadius: 4, borderSkipped: false },
        { label: "NOK", data: data.map((d) => d.NOK), backgroundColor: "#E24B4A", borderRadius: 4, borderSkipped: false },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: GRID }, ticks: TICK },
        y: { grid: { color: GRID }, ticks: TICK },
      },
    },
  });
  return (
    <div style={{ position: "relative", height: 220 }}>
      <canvas ref={ref} />
    </div>
  );
}

function CumulativeChart({ data }) {
  const ref = useRef(null);
  useChart(ref, {
    type: "bar",
    data: {
      labels: data.map((d) => d.hora),
      datasets: [
        { label: "Acumulado", data: data.map((d) => d.total), backgroundColor: "#378ADD", borderRadius: 4, borderSkipped: false },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: GRID }, ticks: TICK },
        y: { grid: { color: GRID }, ticks: TICK },
      },
    },
  });
  return (
    <div style={{ position: "relative", height: 180 }}>
      <canvas ref={ref} />
    </div>
  );
}

function PieChart({ ok, nok }) {
  const ref = useRef(null);
  useChart(ref, {
    type: "doughnut",
    data: {
      labels: ["OK", "NOK"],
      datasets: [
        { data: [ok, nok], backgroundColor: ["#1D9E75", "#E24B4A"], borderWidth: 0, hoverOffset: 4 },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "70%",
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (v) => `${v.label}: ${v.raw.toLocaleString("pt-BR")}` } },
      },
    },
  });
  return (
    <div style={{ position: "relative", height: 160 }}>
      <canvas ref={ref} />
    </div>
  );
}

function DailyTrendChart({ data }) {
  const ref = useRef(null);
  useChart(ref, {
    type: "line",
    data: {
      labels: data.map((d) => d.date),
      datasets: [
        {
          label: "OK",
          data: data.map((d) => d.OK),
          borderColor: "#1D9E75",
          backgroundColor: "rgba(29,158,117,0.12)",
          tension: 0.35,
          fill: true,
          pointRadius: 3,
        },
        {
          label: "NOK",
          data: data.map((d) => d.NOK),
          borderColor: "#E24B4A",
          backgroundColor: "rgba(226,75,74,0.10)",
          tension: 0.35,
          fill: true,
          pointRadius: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: GRID }, ticks: { ...TICK, maxRotation: 45 } },
        y: { grid: { color: GRID }, ticks: TICK },
      },
    },
  });
  return (
    <div style={{ position: "relative", height: 210 }}>
      <canvas ref={ref} />
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function ProductionDashboard({ records, target = 5000 }) {
  const total = records.length;
  const ok = records.filter((r) => r.result === "OK").length;
  const nok = records.filter((r) => r.result === "NOK").length;
  const lots = new Set(records.map((r) => r.productionOrder).filter(Boolean)).size;
  const fpy = pct(ok, total);

  const hourData = groupByHour(records);
  const cumulativeData = cumulativeProduction(records);
  const productData = groupByProduct(records);
  const lotData = groupByLot(records);
  const equipmentData = groupByEquipment(records);
  const shiftData = groupByShift(records);
  const nokPareto = groupNokPareto(records);
  const dailyData = groupByDate(records);
  const isMultiDay = dailyData.length > 1;

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div>
        <SectionLabel>KPIs do dia</SectionLabel>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Total", value: total.toLocaleString("pt-BR"), color: "text-white" },
            { label: "Lotes", value: lots, color: "text-orange-300" },
            { label: "NOK", value: nok.toLocaleString("pt-BR"), color: "text-red-300" },
            { label: "FPY", value: `${fpy}%`, color: "text-cyan-300" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900 p-3 text-center">
              <p className={`text-lg font-bold ${color}`}>{value}</p>
              <p className="text-[10px] text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tendência diária — visível quando há dados de múltiplos dias */}
      {isMultiDay && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <SectionLabel>Tendência diária</SectionLabel>
          <div className="mb-3 flex gap-4">
            {[
              { label: "OK", color: "bg-emerald-400" },
              { label: "NOK", color: "bg-red-400" },
            ].map(({ label, color }) => (
              <span key={label} className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span className={`h-2.5 w-2.5 rounded-sm ${color}`} />
                {label}
              </span>
            ))}
          </div>
          <DailyTrendChart data={dailyData} />
        </div>
      )}

      {/* Meta */}
      <MetaCard total={total} target={target} />

      {/* Turnos */}
      <div>
        <SectionLabel>Produção por turno</SectionLabel>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(shiftData).map(([name, data]) => {
            if (name === "Fora de turno" && data.total === 0) return null;
            return <ShiftCard key={name} name={name} data={data} />;
          })}
        </div>
      </div>

      {/* Hora */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <SectionLabel>Produção por hora</SectionLabel>
        <div className="flex gap-4 mb-3">
          {[
            { label: "OK", color: "bg-emerald-400" },
            { label: "NOK", color: "bg-red-400" },
          ].map(({ label, color }) => (
            <span key={label} className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className={`w-2.5 h-2.5 rounded-sm ${color}`} />
              {label}
            </span>
          ))}
        </div>
        <HourChart data={hourData} />
      </div>

      {/* Acumulado */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <SectionLabel>Produção acumulada</SectionLabel>
        <CumulativeChart data={cumulativeData} />
      </div>

      {/* Pie + Pareto */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <SectionLabel>OK x NOK</SectionLabel>
          <div className="flex gap-3 mb-2">
            <Pill color="green">OK {pct(ok, total)}%</Pill>
            <Pill color="red">NOK {pct(nok, total)}%</Pill>
          </div>
          <PieChart ok={ok} nok={nok} />
        </div>
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
          <SectionLabel>Pareto NOK</SectionLabel>
          {nokPareto.length === 0 ? (
            <p className="text-xs text-red-200/70">Nenhum NOK no filtro atual.</p>
          ) : (
            <div className="mt-1">
              {nokPareto.map((item) => (
                <ParetoRow key={item.name} item={item} max={nokPareto[0].total} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Equipamentos */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <SectionLabel>Equipamentos</SectionLabel>
        {equipmentData.map((item) => (
          <EquipmentRow key={item.equipment} item={item} />
        ))}
      </div>

      {/* Produtos */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <SectionLabel>Top produtos</SectionLabel>
        {productData.map((item) => (
          <ProductRow key={item.product} item={item} />
        ))}
      </div>

      {/* Lotes */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <SectionLabel>Top lotes</SectionLabel>
        {lotData.map((item) => (
          <LotRow key={item.lot} item={item} />
        ))}
      </div>
    </div>
  );
}
