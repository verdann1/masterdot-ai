import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

const titleMap = {
  home: "Dashboard",
  tasks: "Atividades",
  calendar: "Calendário",
  projects: "Projetos",
  kanban: "Kanban",
  problems: "Problemas",
  knowledge: "Base",
  settings: "Configurações",
};

export default function AppHeader({ activeTab, setActiveTab }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/95 px-4 pb-4 pt-5 text-white backdrop-blur">
      <p className="text-xs text-slate-400">Master DOT</p>

      <div className="mt-1 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{titleMap[activeTab] || "Master DOT"}</h1>
          <p className="text-xs text-slate-400">Gestão inteligente de atividades</p>
        </div>

        <Button
          onClick={() => setActiveTab("settings")}
          size="icon"
          variant="ghost"
          className="rounded-full text-slate-200 hover:bg-slate-800"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}