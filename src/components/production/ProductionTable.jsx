import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, Search, X } from "lucide-react";

const PAGE_SIZE = 50;

export default function ProductionTable({ records }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter(
      (item) =>
        (item.date || "").includes(q) ||
        (item.time || "").includes(q) ||
        (item.equipment || "").toLowerCase().includes(q) ||
        (item.product || "").toLowerCase().includes(q) ||
        (item.partNumber || "").toLowerCase().includes(q) ||
        (item.productionOrder || "").toLowerCase().includes(q) ||
        (item.serial || "").toLowerCase().includes(q) ||
        (item.result || "").toLowerCase().includes(q)
    );
  }, [records, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRecords = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  function handleSearch(value) {
    setSearch(value);
    setPage(1);
  }

  if (!records.length) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-500">
        Nenhum apontamento importado.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between p-4"
      >
        <div>
          <h3 className="text-sm font-bold text-white">Registros importados</h3>
          <p className="text-xs text-slate-500">{records.length} registro(s) no total.</p>
        </div>
        {open ? (
          <ChevronDown className="h-5 w-5 text-slate-400" />
        ) : (
          <ChevronRight className="h-5 w-5 text-slate-400" />
        )}
      </button>

      {open && (
        <div className="border-t border-slate-800">
          {/* Search bar */}
          <div className="p-3">
            <div className="relative flex items-center">
              <Search className="absolute left-3 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Buscar por equipamento, PN, serial, resultado..."
                className="h-9 w-full rounded-2xl border border-slate-700 bg-slate-950 pl-8 pr-8 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
              />
              {search && (
                <button
                  onClick={() => handleSearch("")}
                  className="absolute right-3 text-slate-500 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <p className="mt-1.5 text-[10px] text-slate-600">
              {filtered.length} resultado(s){search ? ` para "${search}"` : ""}
              {totalPages > 1 && ` — página ${currentPage}/${totalPages}`}
            </p>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <div className="min-w-[860px]">
              <div className="grid grid-cols-8 gap-2 bg-slate-950 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <span>Data</span>
                <span>Hora</span>
                <span>Equipamento</span>
                <span>Produto</span>
                <span>PN</span>
                <span>OP</span>
                <span>Serial</span>
                <span>Resultado</span>
              </div>

              <div className="max-h-[420px] overflow-y-auto">
                {pageRecords.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    Nenhum registro encontrado.
                  </div>
                ) : (
                  pageRecords.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-8 gap-2 border-b border-slate-800/60 px-3 py-2.5 text-xs text-slate-300 hover:bg-slate-800/30 transition-colors"
                    >
                      <span className="text-slate-400">{item.date}</span>
                      <span className="text-slate-400">{item.time}</span>
                      <span>{item.equipment}</span>
                      <span className="truncate" title={item.product}>{item.product || "—"}</span>
                      <span className="font-mono text-[11px]">{item.partNumber}</span>
                      <span>{item.productionOrder || "—"}</span>
                      <span className="font-mono text-[11px] truncate" title={item.serial}>{item.serial}</span>
                      <span
                        className={
                          item.result === "OK"
                            ? "font-bold text-emerald-300"
                            : "font-bold text-red-300"
                        }
                      >
                        {item.result}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-800 px-3 py-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-400 disabled:opacity-30 hover:enabled:border-cyan-500/40 hover:enabled:text-white"
              >
                ← Anterior
              </button>
              <span className="text-[11px] text-slate-500">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-400 disabled:opacity-30 hover:enabled:border-cyan-500/40 hover:enabled:text-white"
              >
                Próxima →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
