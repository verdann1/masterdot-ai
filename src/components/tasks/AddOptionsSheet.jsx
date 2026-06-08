import { X, ClipboardList, FolderKanban, AlertTriangle, Database, FileSpreadsheet } from "lucide-react";
import { motion } from "framer-motion";

const options = [
  {
    id: "task",
    title: "Nova atividade",
    description: "Criar uma atividade manualmente",
    icon: ClipboardList,
    color: "text-cyan-300 bg-cyan-500/15 border-cyan-500/20",
  },
  {
    id: "project",
    title: "Novo projeto",
    description: "Criar agrupador de atividades",
    icon: FolderKanban,
    color: "text-orange-300 bg-orange-500/15 border-orange-500/20",
  },
  {
    id: "problem",
    title: "Novo problema",
    description: "Registrar problema vinculado",
    icon: AlertTriangle,
    color: "text-red-300 bg-red-500/15 border-red-500/20",
  },
  {
    id: "knowledge",
    title: "Nova base",
    description: "Registrar informação útil",
    icon: Database,
    color: "text-emerald-300 bg-emerald-500/15 border-emerald-500/20",
  },
];

export default function AddOptionsSheet({ app }) {
  function openMode(mode) {
    app.setQuickMode(mode);
    app.setShowAddOptions(false);
    app.setShowQuickAdd(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ y: 260, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        className="w-full rounded-t-[36px] border-t border-slate-800 bg-slate-950 p-4 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Adicionar</h2>
            <p className="text-sm text-slate-500">Escolha o que deseja criar</p>
          </div>

          <button
            onClick={() => app.setShowAddOptions(false)}
            className="rounded-2xl bg-slate-900 p-3 text-slate-400"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {options.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => openMode(item.id)}
                className={`rounded-[26px] border p-4 text-left ${item.color}`}
              >
                <Icon className="mb-3 h-6 w-6" />

                <h3 className="text-sm font-bold text-white">{item.title}</h3>

                <p className="mt-1 text-xs text-slate-400">
                  {item.description}
                </p>
              </button>
            );
          })}
        </div>

        <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-[26px] border border-blue-500/20 bg-blue-500/10 p-4 text-blue-300">
          <FileSpreadsheet className="h-6 w-6" />

          <div>
            <h3 className="text-sm font-bold text-white">Importar Excel</h3>
            <p className="text-xs text-slate-400">
              Criar projetos e atividades automaticamente
            </p>
          </div>

          <input
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(event) => {
              app.importActivitiesFromExcel(event);
              app.setShowAddOptions(false);
            }}
          />
        </label>
      </motion.div>
    </div>
  );
}