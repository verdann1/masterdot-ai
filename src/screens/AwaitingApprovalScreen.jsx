import { Clock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import MetaPulseLogo from "../components/common/MetaPulseLogo";
import DarkCard from "../components/common/DarkCard";

export default function AwaitingApprovalScreen({ app }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-slate-100">
      <div className="w-full max-w-md space-y-4">
        <div className="flex flex-col items-center gap-3">
          <MetaPulseLogo iconSize={72} layout="icon" />
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-white">Meta</span><span className="text-blue-400">Pulse</span>
          </h1>
        </div>

        <DarkCard>
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <div className="rounded-2xl bg-amber-500/15 p-3">
              <Clock className="h-7 w-7 text-amber-300" />
            </div>
            <h2 className="text-lg font-bold text-white">Aguardando aprovação</h2>
            <p className="text-sm text-slate-400">
              Sua conta <span className="font-medium text-slate-200">{app.userEmail}</span> foi
              registrada e está aguardando a aprovação de um administrador para acessar o workspace.
            </p>
            <p className="text-xs text-slate-500">
              Assim que for liberada, basta entrar novamente.
            </p>
          </div>

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
    </div>
  );
}
