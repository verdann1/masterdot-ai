import { Pencil, Trash2 } from "lucide-react";
import DarkCard from "../components/common/DarkCard";
import Empty from "../components/common/Empty";
import EditKnowledgeSheet from "../components/knowledge/EditKnowledgeSheet";

export default function KnowledgeScreen({ app }) {
  if (!app.knowledge.length) return <Empty text="Nenhum item salvo." />;

  return (
    <>
      <div className="space-y-3">
        {app.knowledge.map((item) => (
          <DarkCard key={item.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500">{item.category}</p>
                <h3 className="font-semibold text-white">{item.title}</h3>
                {item.createdAt && (
                  <p className="mt-0.5 text-[10px] text-slate-600">
                    {item.createdAt.split("-").reverse().join("/")}
                  </p>
                )}
              </div>

              <div className="flex gap-1.5 shrink-0">
                <button
                  className="rounded-xl bg-slate-800 p-1.5 text-slate-400"
                  onClick={() => app.setEditingKnowledge(item)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  className="rounded-xl bg-red-500/10 p-1.5 text-red-400"
                  onClick={() => app.deleteKnowledge(item.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <p className="whitespace-pre-wrap text-sm text-slate-300">{item.content}</p>
          </DarkCard>
        ))}
      </div>

      {app.editingKnowledge && <EditKnowledgeSheet app={app} />}
    </>
  );
}
