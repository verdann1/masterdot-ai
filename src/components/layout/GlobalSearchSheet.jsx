import { useState, useMemo } from "react";
import { X, Search, CheckSquare, AlertTriangle, BookOpen, ChevronRight } from "lucide-react";

const STATUS_COLOR = {
  "Concluído":     "text-emerald-400",
  "Em andamento":  "text-blue-400",
  "Aguardando":    "text-purple-400",
  "Aberto":        "text-amber-400",
};

function highlight(text, query) {
  if (!query || !text) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-blue-500/30 text-blue-200 rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function ResultSection({ icon: Icon, label, color, items, onSelect }) {
  if (!items.length) return null;
  return (
    <div>
      <div className={`flex items-center gap-2 mb-2 ${color}`}>
        <Icon className="h-3.5 w-3.5" />
        <p className="text-[11px] font-bold uppercase tracking-wide">{label}</p>
        <span className="rounded-full bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">{items.length}</span>
      </div>
      <div className="space-y-1.5">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            className="flex w-full items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-left active:opacity-70"
          >
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-white">{item._highlight}</p>
              {item._sub && <p className="truncate text-[11px] text-slate-500">{item._sub}</p>}
            </div>
            {item._badge && (
              <span className={`shrink-0 text-[10px] font-semibold ${item._badgeColor || "text-slate-500"}`}>
                {item._badge}
              </span>
            )}
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-600" />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function GlobalSearchSheet({ app, onClose }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (q.length < 2) return { tasks: [], problems: [], knowledge: [] };

    const tasks = app.tasks
      .filter((t) =>
        t.title?.toLowerCase().includes(q) ||
        t.project?.toLowerCase().includes(q) ||
        t.notes?.toLowerCase().includes(q) ||
        t.responsible?.toLowerCase().includes(q) ||
        (t.responsibles || []).some((r) => r.toLowerCase().includes(q))
      )
      .slice(0, 6)
      .map((t) => ({
        ...t,
        _type: "task",
        _highlight: highlight(t.title, q),
        _sub: t.project,
        _badge: t.status,
        _badgeColor: STATUS_COLOR[t.status] || "text-slate-400",
      }));

    const problems = app.problems
      .filter((p) =>
        p.problem?.toLowerCase().includes(q) ||
        p.product?.toLowerCase().includes(q) ||
        p.action?.toLowerCase().includes(q) ||
        p.responsible?.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map((p) => ({
        ...p,
        _type: "problem",
        _highlight: highlight(p.problem, q),
        _sub: [p.product, p.responsible].filter(Boolean).join(" · "),
        _badge: p.due || null,
        _badgeColor: "text-slate-500",
      }));

    const knowledge = app.knowledge
      .filter((k) =>
        k.title?.toLowerCase().includes(q) ||
        k.content?.toLowerCase().includes(q) ||
        k.category?.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map((k) => ({
        ...k,
        _type: "knowledge",
        _highlight: highlight(k.title, q),
        _sub: k.category,
        _badge: null,
      }));

    return { tasks, problems, knowledge };
  }, [q, app.tasks, app.problems, app.knowledge]);

  const total = results.tasks.length + results.problems.length + results.knowledge.length;

  function handleSelect(item) {
    if (item._type === "task") {
      app.setSelectedTaskId(item.id);
      app.setActiveTab("tasks");
    } else if (item._type === "problem") {
      app.setActiveTab("problems");
    } else if (item._type === "knowledge") {
      app.setActiveTab("knowledge");
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-sm">
      {/* Search bar */}
      <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-4">
        <Search className="h-5 w-5 shrink-0 text-blue-400" />
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar atividades, problemas, base de conhecimento…"
          className="flex-1 bg-transparent text-base text-white placeholder-slate-500 focus:outline-none"
        />
        <button onClick={onClose} className="rounded-full bg-slate-800 p-2 text-slate-400">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {q.length < 2 && (
          <div className="py-12 text-center">
            <Search className="mx-auto mb-3 h-10 w-10 text-slate-700" />
            <p className="text-sm text-slate-500">Digite pelo menos 2 caracteres para buscar</p>
          </div>
        )}

        {q.length >= 2 && total === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-slate-500">Nenhum resultado para <strong className="text-slate-300">"{query}"</strong></p>
          </div>
        )}

        {q.length >= 2 && total > 0 && (
          <>
            <ResultSection
              icon={CheckSquare}
              label="Atividades"
              color="text-blue-400"
              items={results.tasks}
              onSelect={handleSelect}
            />
            <ResultSection
              icon={AlertTriangle}
              label="Problemas"
              color="text-amber-400"
              items={results.problems}
              onSelect={handleSelect}
            />
            <ResultSection
              icon={BookOpen}
              label="Base de conhecimento"
              color="text-purple-400"
              items={results.knowledge}
              onSelect={handleSelect}
            />
          </>
        )}
      </div>
    </div>
  );
}
