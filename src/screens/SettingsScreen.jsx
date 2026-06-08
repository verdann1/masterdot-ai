import { Bell, Bot, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import DarkCard from "../components/common/DarkCard";

export default function SettingsScreen({ app }) {
  return (
    <div className="space-y-4">
      <DarkCard>
        <h2 className="text-lg font-bold text-white">Alertas</h2>

        <p className="mt-1 text-sm text-slate-500">
          Ative notificações locais para atividades atrasadas, críticas e
          vencimentos próximos.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-slate-950 p-3 text-center">
            <p className="text-xs text-slate-500">Atrasadas</p>
            <p className="text-xl font-bold text-red-300">
              {app.taskAlerts?.late?.length || 0}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-950 p-3 text-center">
            <p className="text-xs text-slate-500">Hoje</p>
            <p className="text-xl font-bold text-cyan-300">
              {app.taskAlerts?.todayDue?.length || 0}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-950 p-3 text-center">
            <p className="text-xs text-slate-500">Críticas</p>
            <p className="text-xl font-bold text-orange-300">
              {app.taskAlerts?.critical?.length || 0}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-950 p-3 text-center">
            <p className="text-xs text-slate-500">7 dias</p>
            <p className="text-xl font-bold text-blue-300">
              {app.taskAlerts?.next7?.length || 0}
            </p>
          </div>
        </div>

        <Button
          className="mt-4 h-11 w-full rounded-2xl bg-cyan-500 text-white"
          onClick={app.enableNotifications}
        >
          <Bell className="mr-2 h-4 w-4" />
          Ativar notificações
        </Button>
      </DarkCard>

      <DarkCard>
        <h2 className="text-lg font-bold text-white">Inteligência Artificial</h2>

        <p className="mt-1 text-sm text-slate-500">
          Use a IA para recalcular prioridades das atividades.
        </p>

        <div className="mt-4 space-y-2">
          <Button
            className="h-11 w-full rounded-2xl bg-purple-500 text-white"
            onClick={app.applyAiPriority}
          >
            <Bot className="mr-2 h-4 w-4" />
            IA Priority
          </Button>

          <Button
            variant="outline"
            className="h-11 w-full rounded-2xl border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
            onClick={() => app.setActiveTab("ai")}
          >
            Abrir Assistente IA
          </Button>
        </div>
      </DarkCard>

      <DarkCard>
        <h2 className="text-lg font-bold text-white">Conta</h2>

        <p className="mt-1 text-sm text-slate-500">
          Sair da conta atual do Master DOT.
        </p>

        <Button
          variant="outline"
          className="mt-4 h-11 w-full rounded-2xl border-red-500/40 bg-red-500/10 text-red-300"
          onClick={app.logout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </DarkCard>
    </div>
  );
}