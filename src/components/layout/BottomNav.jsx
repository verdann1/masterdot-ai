import {
  Home,
  ListTodo,
  Plus,
  CalendarDays,
  FolderKanban,
  Columns3,
  Bot,
} from "lucide-react";

export default function BottomNav({ activeTab, setActiveTab, onAddClick }) {
  const items = [
    { id: "home", label: "Home", icon: Home },
    { id: "tasks", label: "Atividades", icon: ListTodo },
    { id: "add", label: "Adicionar", icon: Plus, action: onAddClick },
    { id: "calendar", label: "Calendário", icon: CalendarDays },
    { id: "projects", label: "Projetos", icon: FolderKanban },
    { id: "kanban", label: "Kanban", icon: Columns3 },
    { id: "ai", label: "IA", icon: Bot },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 z-30 grid h-16 w-full max-w-md -translate-x-1/2 grid-cols-7 border-t border-slate-800 bg-slate-950 px-1">
      {items.map((item) => {
        const Icon = item.icon;
        const active = activeTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => (item.action ? item.action() : setActiveTab(item.id))}
            className={`flex flex-col items-center justify-center gap-1 text-[9px] font-medium ${
              active ? "text-white" : "text-slate-500"
            }`}
          >
            <span
              className={
                item.id === "add"
                  ? "rounded-full bg-slate-100 p-2 text-slate-950"
                  : ""
              }
            >
              <Icon className="h-5 w-5" />
            </span>
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}