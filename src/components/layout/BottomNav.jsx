import {
  Home,
  ListTodo,
  Plus,
  CalendarDays,
  FolderKanban,
  Columns3,
  Bot,
  Factory,
} from "lucide-react";

import { motion } from "framer-motion";

export default function BottomNav({ activeTab, setActiveTab, onAddClick }) {
  const items = [
    { id: "home", label: "Home", icon: Home },
    { id: "tasks", label: "Atividades", icon: ListTodo },
    { id: "calendar", label: "Calendário", icon: CalendarDays },
    { id: "add", label: "Adicionar", icon: Plus, action: onAddClick },
    { id: "projects", label: "Projetos", icon: FolderKanban },
    { id: "kanban", label: "Kanban", icon: Columns3 },
    { id: "production", label: "Produção", icon: Factory },
//    { id: "ai", label: "IA", icon: Bot },
  ];

  return (
    <nav className="fixed bottom-3 left-1/2 z-40 w-[94%] max-w-md -translate-x-1/2">
      <div className="master-glass grid grid-cols-7 rounded-[28px] border border-slate-800/80 p-2 shadow-2xl shadow-black/40">
        {items.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => (item.action ? item.action() : setActiveTab(item.id))}
              className="relative flex flex-col items-center justify-center gap-1 rounded-2xl py-2 text-[9px] font-medium"
            >
              {active && item.id !== "add" && (
                <motion.div
                  layoutId="bottom-active"
                  className="absolute inset-0 rounded-2xl bg-cyan-500/20"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}

              <span
                className={`relative z-10 ${
                  item.id === "add"
                    ? "rounded-full bg-white p-3 text-slate-950 shadow-lg shadow-cyan-500/20"
                    : active
                    ? "text-cyan-300"
                    : "text-slate-500"
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>

              <span className={`relative z-10 ${active ? "text-white" : "text-slate-500"}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}