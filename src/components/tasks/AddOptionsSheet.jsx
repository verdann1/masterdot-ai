import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AddOptionsSheet({ app }) {
  function openAdd(mode) {
    app.setQuickMode(mode);
    app.setShowAddOptions(false);
    app.setShowQuickAdd(true);
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/60">
      <div className="absolute bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 rounded-t-[2rem] border border-slate-800 bg-slate-900 p-4 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">Adicionar</p>
            <h2 className="text-lg font-bold text-white">Escolha o tipo</h2>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="text-slate-300"
            onClick={() => app.setShowAddOptions(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid gap-3">
          <AddOption label="Atividade / Subatividade" description="Criar ação com início, fim, responsável e andamento" onClick={() => openAdd("task")} />
          <AddOption label="Projeto" description="Criar novo agrupador de atividades" onClick={() => openAdd("project")} />
          <AddOption label="Problema" description="Registrar problema ou impedimento" onClick={() => openAdd("problem")} />
          <AddOption label="Base" description="Salvar conhecimento ou anotação útil" onClick={() => openAdd("knowledge")} />
        </div>
      </div>
    </div>
  );
}

function AddOption({ label, description, onClick }) {
  return (
    <button onClick={onClick} className="rounded-3xl border border-slate-800 bg-slate-950 p-4 text-left hover:bg-slate-800">
      <p className="font-semibold text-white">{label}</p>
      <p className="mt-1 text-sm text-slate-400">{description}</p>
    </button>
  );
}