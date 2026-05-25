import { Bell, BrainCircuit, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import DarkCard from "../components/common/DarkCard";

export default function SettingsScreen({ app }) {
  return (
    <div className="space-y-3">
      <DarkCard>
        <h3 className="font-semibold text-white">Resumo local</h3>

        <p className="text-sm text-slate-300">
          <b>Atividades:</b> {app.tasks.length}
        </p>
        <p className="text-sm text-slate-300">
          <b>Projetos:</b> {app.projects.length}
        </p>
        <p className="text-sm text-slate-300">
          <b>Problemas:</b> {app.problems.length}
        </p>
        <p className="text-sm text-slate-300">
          <b>Base:</b> {app.knowledge.length}
        </p>

        <p className="pt-2 text-xs text-slate-500">Dados salvos localmente no app.</p>
      </DarkCard>

      <Button onClick={app.enableNotifications} className="h-12 w-full rounded-2xl bg-blue-500 text-white hover:bg-blue-400">
        <Bell className="mr-2 h-4 w-4" />
        Ativar notificações
      </Button>

      <Button onClick={app.applyAiPriority} className="h-12 w-full rounded-2xl bg-purple-500 text-white hover:bg-purple-400">
        <BrainCircuit className="mr-2 h-4 w-4" />
        Priorizar com IA local
      </Button>
      
      <Button onClick={app.logout} className="h-12 w-full rounded-2xl bg-red-500 text-white hover:bg-red-400">
       Sair da conta
      </Button>

      <label className="flex h-12 w-full cursor-pointer items-center justify-center rounded-2xl bg-slate-100 text-sm font-medium text-slate-950 hover:bg-white">
        <Upload className="mr-2 h-4 w-4" />
        Importar atividades Excel
        <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={app.importActivitiesFromExcel} />
      </label>

      <label className="flex h-12 w-full cursor-pointer items-center justify-center rounded-2xl bg-slate-800 text-sm font-medium text-slate-100 hover:bg-slate-700">
        <Upload className="mr-2 h-4 w-4" />
        Importar backup JSON
        <input type="file" accept=".json" className="hidden" onChange={app.importBackup} />
      </label>

      <Button onClick={app.exportBackup} className="h-12 w-full rounded-2xl bg-slate-800 text-slate-100 hover:bg-slate-700">
        <Download className="mr-2 h-4 w-4" />
        Exportar backup
      </Button>
    </div>
  );
}