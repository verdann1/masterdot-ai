import { useMemo, useState } from "react";
import { Target, Trash2, Upload, Download } from "lucide-react";
import ProductionDashboard from "../components/production/ProductionDashboard";
import ProductionTable from "../components/production/ProductionTable";

function timeToMinutes(time) {
  const [hour, minute] = String(time || "00:00").split(":").map(Number);
  return hour * 60 + minute;
}

function getShift(record) {
  const minutes = timeToMinutes(record.time);
  const firstStart = timeToMinutes("05:00");
  const firstEnd = timeToMinutes("15:48");
  const secondStart = timeToMinutes("15:50");
  const secondEnd = timeToMinutes("01:30");
  if (minutes >= firstStart && minutes <= firstEnd) return "1º turno";
  if (minutes >= secondStart || minutes <= secondEnd) return "2º turno";
  return "Fora de turno";
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-2xl border border-slate-700 bg-slate-950 px-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
      >
        {options.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
    </div>
  );
}

function exportFilteredCsv(records) {
  const headers = ["Data", "Hora", "Equipamento", "Produto", "PN", "OP", "Serial", "Resultado"];
  const rows = records.map((r) => [
    r.date,
    r.time,
    r.equipment,
    r.product || "",
    r.partNumber,
    r.productionOrder || "",
    r.serial,
    r.result,
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `producao-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ProductionScreen({ app }) {
  const [resultFilter, setResultFilter] = useState("Todos");
  const [equipmentFilter, setEquipmentFilter] = useState("Todos");
  const [productFilter, setProductFilter] = useState("Todos");
  const [lotFilter, setLotFilter] = useState("Todos");
  const [shiftFilter, setShiftFilter] = useState("Todos");

  const recordsWithShift = useMemo(() => {
    return app.productionRecords.map((item) => ({
      ...item,
      shift: getShift(item),
    }));
  }, [app.productionRecords]);

  const equipments = useMemo(() => [
    "Todos",
    ...new Set(recordsWithShift.map((item) => item.equipment).filter(Boolean)),
  ], [recordsWithShift]);

  const products = useMemo(() => [
    "Todos",
    ...new Set(recordsWithShift.map((item) => item.product).filter(Boolean)),
  ], [recordsWithShift]);

  const lots = useMemo(() => [
    "Todos",
    ...new Set(recordsWithShift.map((item) => item.productionOrder).filter(Boolean)),
  ], [recordsWithShift]);

  const shifts = ["Todos", "1º turno", "2º turno", "Fora de turno"];

  const filteredRecords = useMemo(() => {
    return recordsWithShift.filter((item) => (
      (resultFilter === "Todos" || item.result === resultFilter) &&
      (equipmentFilter === "Todos" || item.equipment === equipmentFilter) &&
      (productFilter === "Todos" || item.product === productFilter) &&
      (lotFilter === "Todos" || item.productionOrder === lotFilter) &&
      (shiftFilter === "Todos" || item.shift === shiftFilter)
    ));
  }, [recordsWithShift, resultFilter, equipmentFilter, productFilter, lotFilter, shiftFilter]);

  const hasActiveFilter =
    resultFilter !== "Todos" ||
    equipmentFilter !== "Todos" ||
    productFilter !== "Todos" ||
    lotFilter !== "Todos" ||
    shiftFilter !== "Todos";

  function resetFilters() {
    setResultFilter("Todos");
    setEquipmentFilter("Todos");
    setProductFilter("Todos");
    setLotFilter("Todos");
    setShiftFilter("Todos");
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-[32px] border border-slate-800 bg-slate-900 p-4">
        <h2 className="text-xl font-bold text-white">Produção</h2>
        <p className="mt-1 text-sm text-slate-500">
          Acompanhamento visual dos testes Klippel.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <label className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-cyan-500 text-sm font-bold text-white active:opacity-80">
            <Upload className="h-4 w-4" />
            Importar
            <input
              type="file"
              accept="*/*"
              className="hidden"
              onChange={app.importProductionExcel}
            />
          </label>

          <button
            onClick={app.clearProductionRecords}
            className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 text-sm font-bold text-red-300 active:opacity-80"
          >
            <Trash2 className="h-4 w-4" />
            Limpar
          </button>
        </div>

        {filteredRecords.length > 0 && (
          <button
            onClick={() => exportFilteredCsv(filteredRecords)}
            className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 text-xs font-semibold text-slate-300 active:opacity-80"
          >
            <Download className="h-3.5 w-3.5" />
            Exportar CSV ({filteredRecords.length} registros)
          </button>
        )}
      </div>

      {/* Meta */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-3">
        <div className="mb-3 flex items-center gap-2">
          <Target className="h-4 w-4 text-cyan-300" />
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Meta diária
          </p>
        </div>
        <input
          type="number"
          min="0"
          value={app.productionTarget}
          onChange={(e) => app.setProductionTarget(Number(e.target.value || 0))}
          className="h-11 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 text-sm text-white focus:outline-none focus:border-cyan-500/50"
          placeholder="Meta de produção"
        />
      </div>

      {/* Filters */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-3">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Filtros
          </p>
          {hasActiveFilter && (
            <button
              onClick={resetFilters}
              className="text-[10px] font-medium text-cyan-400 hover:text-cyan-300"
            >
              Limpar filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FilterSelect
            label="Resultado"
            value={resultFilter}
            onChange={setResultFilter}
            options={["Todos", "OK", "NOK"]}
          />
          <FilterSelect
            label="Turno"
            value={shiftFilter}
            onChange={setShiftFilter}
            options={shifts}
          />
          <FilterSelect
            label="Equipamento"
            value={equipmentFilter}
            onChange={setEquipmentFilter}
            options={equipments}
          />
          <FilterSelect
            label="Produto"
            value={productFilter}
            onChange={setProductFilter}
            options={products}
          />
          <FilterSelect
            label="Lote / OP"
            value={lotFilter}
            onChange={setLotFilter}
            options={lots}
          />
        </div>

        <p className="mt-3 text-xs text-slate-500">
          {filteredRecords.length} registro(s) exibido(s)
          {hasActiveFilter && (
            <span className="ml-1 text-cyan-500/70">· filtro ativo</span>
          )}
        </p>
      </div>

      {/* Dashboard & Table */}
      <ProductionDashboard
        records={filteredRecords}
        target={app.productionTarget}
      />

      <ProductionTable records={filteredRecords} />
    </div>
  );
}
