import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Home,
  ListTodo,
  Plus,
  CalendarDays,
  LayoutGrid,
  FolderKanban,
  Columns3,
  Clock,
  Zap,
  X,
} from "lucide-react";

// ── Navigation definition ────────────────────────────────────────────────
const PRIMARY = [
  { id: "home",     label: "Home",       icon: Home         },
  { id: "tasks",    label: "Atividades", icon: ListTodo     },
  { id: "add",      label: "",           icon: Plus         }, // center CTA
  { id: "calendar", label: "Calendário", icon: CalendarDays },
  { id: "more",     label: "Mais",       icon: LayoutGrid   },
];

const MORE_ITEMS = [
  { id: "projects",     label: "Projetos",     icon: FolderKanban, color: "text-violet-300",  bg: "bg-violet-500/12" },
  { id: "kanban",       label: "Kanban",        icon: Columns3,     color: "text-blue-300",    bg: "bg-blue-500/12"   },
  { id: "timetracking", label: "Ponto",         icon: Clock,        color: "text-emerald-300", bg: "bg-emerald-500/12"},
  { id: "focus",        label: "Modo Foco",     icon: Zap,          color: "text-cyan-300",    bg: "bg-cyan-500/12"   },
];

const MORE_IDS = new Set(MORE_ITEMS.map((i) => i.id));

// ── Component ─────────────────────────────────────────────────────────────
export default function BottomNav({ activeTab, setActiveTab, onAddClick }) {
  const [showMore, setShowMore] = useState(false);
  const isMoreActive = MORE_IDS.has(activeTab);

  function navigate(id) {
    setShowMore(false);
    setActiveTab(id);
  }

  return (
    <>
      {/* ── More sheet ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showMore && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowMore(false)}
            />

            {/* Sheet */}
            <motion.div
              key="sheet"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0,      opacity: 1 }}
              exit={{   y: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 34 }}
              className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md"
            >
              <div className="mp-card mx-3 mb-24 rounded-[32px] p-5">
                {/* Handle + header */}
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400/70">
                      MetaPulse
                    </p>
                    <h2 className="text-lg font-bold text-white">Navegação</h2>
                  </div>
                  <button
                    onClick={() => setShowMore(false)}
                    className="rounded-2xl bg-slate-800 p-2 text-slate-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* 3×2 grid */}
                <div className="grid grid-cols-3 gap-3">
                  {MORE_ITEMS.map(({ id, label, icon: Icon, color, bg }) => {
                    const active = activeTab === id;
                    return (
                      <button
                        key={id}
                        onClick={() => navigate(id)}
                        className={`flex flex-col items-center gap-2 rounded-2xl p-4 transition-all active:scale-95 ${
                          active
                            ? "bg-cyan-500/15 ring-1 ring-cyan-500/30"
                            : bg
                        }`}
                      >
                        <span className={`${color}`}>
                          <Icon className="h-6 w-6" />
                        </span>
                        <span className={`text-[11px] font-semibold ${active ? "text-cyan-300" : "text-slate-400"}`}>
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Bottom bar ─────────────────────────────────────────── */}
      <nav className="fixed bottom-3 left-1/2 z-40 w-[90%] max-w-md -translate-x-1/2">
        <div className="master-glass grid grid-cols-5 rounded-[28px] border border-white/5 p-2 shadow-2xl shadow-black/60 ring-1 ring-inset ring-white/[0.04]">
          {PRIMARY.map((item) => {
            const Icon   = item.icon;
            const isAdd  = item.id === "add";
            const isMore = item.id === "more";

            // "more" button is active when sheet is open OR when a secondary screen is active
            const active = isMore
              ? showMore || isMoreActive
              : activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (isAdd)  { setShowMore(false); onAddClick(); return; }
                  if (isMore) { setShowMore((v) => !v); return; }
                  setShowMore(false);
                  setActiveTab(item.id);
                }}
                className="relative flex flex-col items-center justify-center gap-1 rounded-[20px] py-2.5"
              >
                {/* Active pill */}
                {active && !isAdd && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-[20px] bg-cyan-500/15"
                    style={{
                      boxShadow: "0 0 18px rgba(6,182,212,0.14), inset 0 1px 0 rgba(6,182,212,0.1)",
                    }}
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}

                {/* Icon */}
                {isAdd ? (
                  <span
                    className="relative z-10 rounded-full p-3"
                    style={{
                      background: "linear-gradient(135deg,#22d3ee 0%,#06b6d4 55%,#0891b2 100%)",
                      boxShadow: "0 4px 18px rgba(6,182,212,0.5), inset 0 1px 0 rgba(255,255,255,0.18)",
                    }}
                  >
                    <Icon className="h-5 w-5 text-white" strokeWidth={2.5} />
                  </span>
                ) : (
                  <span className={`relative z-10 transition-colors duration-200 ${active ? "text-cyan-300" : "text-slate-500"}`}>
                    <Icon className="h-[22px] w-[22px]" />
                  </span>
                )}

                {/* Label */}
                {!isAdd && (
                  <span className={`relative z-10 text-[10px] font-semibold leading-none tracking-wide transition-colors ${active ? "text-cyan-300" : "text-slate-600"}`}>
                    {item.label}
                  </span>
                )}

                {/* Active underline */}
                {active && !isAdd && (
                  <motion.span
                    layoutId="nav-pip"
                    className="absolute bottom-[3px] h-[2px] w-5 rounded-full bg-cyan-400/60"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}

                {/* "Mais" active dot when in secondary screen */}
                {isMore && isMoreActive && !showMore && (
                  <span className="absolute right-3 top-2 h-1.5 w-1.5 rounded-full bg-cyan-400" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
