import { Settings, WifiOff, Search } from "lucide-react";
import MetaPulseLogo from "../common/MetaPulseLogo";

const titles = {
  home:         "Dashboard",
  tasks:        "Atividades",
  calendar:     "Calendário",
  projects:     "Projetos",
  kanban:       "Kanban",
  problems:     "Problemas",
  knowledge:    "Base de Conhecimento",
  settings:     "Configurações",
  timetracking: "Registro de Ponto",
  focus:        "Modo Foco",
  responsible:  "Por Responsável",
  kpi:          "KPIs & Analytics",
  team:         "Equipe",
};

export default function AppHeader({ activeTab, setActiveTab, isOnline, onSearchOpen }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 px-4 py-4 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <MetaPulseLogo iconSize={38} layout="icon" />

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white">
                  {titles[activeTab] || "MetaPulse"}
                </h1>
                {!isOnline && (
                  <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                    <WifiOff className="h-3 w-3" />
                    Offline
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {isOnline ? "Gestão inteligente de atividades" : "Salvando localmente"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onSearchOpen}
            className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 text-slate-400 shadow-lg"
            aria-label="Busca global"
          >
            <Search className="h-5 w-5" />
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 text-slate-300 shadow-lg"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
