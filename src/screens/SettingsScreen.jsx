import { Bell, BellOff, LogOut, CloudUpload, Sunrise } from "lucide-react";
import { Button } from "@/components/ui/button";
import DarkCard from "../components/common/DarkCard";

export default function SettingsScreen({ app }) {
  return (
    <div className="space-y-4">
      <DarkCard>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Notificações</h2>
          <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            app.notificationsEnabled
              ? "bg-emerald-500/15 text-emerald-300"
              : "bg-slate-800 text-slate-500"
          }`}>
            {app.notificationsEnabled
              ? <><Bell className="h-3 w-3" /> Ativas</>
              : <><BellOff className="h-3 w-3" /> Desativadas</>
            }
          </span>
        </div>

        <p className="mt-1 text-sm text-slate-500">
          Notificações individuais por prazo (hoje, amanhã, D-1) e resumo diário de atrasadas e críticas.
        </p>

        <div className="mt-4 grid grid-cols-4 gap-1.5">
          <div className="rounded-2xl bg-red-500/10 p-2.5 text-center">
            <p className="text-lg font-bold text-red-300">
              {app.taskAlerts?.late?.length || 0}
            </p>
            <p className="text-[10px] text-slate-500">Atrasadas</p>
          </div>
          <div className="rounded-2xl bg-sky-500/10 p-2.5 text-center">
            <p className="text-lg font-bold text-sky-300">
              {app.taskAlerts?.todayDue?.length || 0}
            </p>
            <p className="text-[10px] text-slate-500">Hoje</p>
          </div>
          <div className="rounded-2xl bg-blue-500/10 p-2.5 text-center">
            <p className="text-lg font-bold text-blue-300">
              {app.taskAlerts?.next7?.length || 0}
            </p>
            <p className="text-[10px] text-slate-500">7 dias</p>
          </div>
          <div className="rounded-2xl bg-orange-500/10 p-2.5 text-center">
            <p className="text-lg font-bold text-orange-300">
              {app.taskAlerts?.critical?.length || 0}
            </p>
            <p className="text-[10px] text-slate-500">Críticas</p>
          </div>
        </div>

        {/* Advanced notification prefs */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-2xl bg-slate-950 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <Sunrise className="h-4 w-4 text-amber-400" />
              <div>
                <p className="text-sm font-medium text-white">Resumo diário às 7h</p>
                <p className="text-[11px] text-slate-500">Briefing matinal com atividades do dia</p>
              </div>
            </div>
            <button
              onClick={app.toggleDailyBriefing}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                app.dailyBriefingEnabled ? "bg-amber-500" : "bg-slate-700"
              }`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                app.dailyBriefingEnabled ? "translate-x-5" : "translate-x-0.5"
              }`} />
            </button>
          </div>

          <div className="rounded-2xl bg-slate-950 px-3 py-2.5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Alertar X dias antes do prazo
            </p>
            <div className="flex gap-2">
              {[1, 3, 5, 7, 14].map((n) => (
                <button
                  key={n}
                  onClick={() => app.updateNotifDaysBefore(n)}
                  className={`flex-1 rounded-xl py-1.5 text-xs font-bold transition-colors ${
                    app.notifDaysBefore === n
                      ? "bg-blue-500 text-white"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {n}d
                </button>
              ))}
            </div>
          </div>
        </div>

        <Button
          className="mt-4 h-11 w-full rounded-2xl bg-blue-500 text-white"
          onClick={app.enableNotifications}
        >
          <Bell className="mr-2 h-4 w-4" />
          {app.notificationsEnabled ? "Reagendar notificações" : "Ativar notificações"}
        </Button>
      </DarkCard>

      <DarkCard>
        <h2 className="text-lg font-bold text-white">Sincronização</h2>

        <p className="mt-1 text-sm text-slate-500">
          Envia todos os dados locais (atividades, projetos, problemas e base de
          conhecimento) para o Firebase agora.
        </p>

        <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl bg-slate-950 p-3 text-center">
          <div>
            <p className="text-lg font-bold text-white">{app.tasks.length}</p>
            <p className="text-[10px] text-slate-500">Atividades</p>
          </div>
          <div>
            <p className="text-lg font-bold text-white">{app.projects.length}</p>
            <p className="text-[10px] text-slate-500">Projetos</p>
          </div>
          <div>
            <p className="text-lg font-bold text-white">{app.problems.length}</p>
            <p className="text-[10px] text-slate-500">Problemas</p>
          </div>
        </div>

        <Button
          className="mt-4 h-11 w-full rounded-2xl bg-blue-600 text-white"
          onClick={app.syncAllToFirebase}
          disabled={!app.userId}
        >
          <CloudUpload className="mr-2 h-4 w-4" />
          Sincronizar com Firebase
        </Button>
      </DarkCard>

      <DarkCard>
        <h2 className="text-lg font-bold text-white">Conta</h2>

        <p className="mt-1 text-sm text-slate-500">
          Sair da conta atual do MetaPulse.
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