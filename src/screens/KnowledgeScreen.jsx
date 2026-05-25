import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import DarkCard from "../components/common/DarkCard";
import Empty from "../components/common/Empty";

export default function KnowledgeScreen({ app }) {
  if (!app.knowledge.length) return <Empty text="Nenhum item salvo." />;

  return (
    <div className="space-y-3">
      {app.knowledge.map((item) => (
        <DarkCard key={item.id}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500">{item.category}</p>
              <h3 className="font-semibold text-white">{item.title}</h3>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400"
              onClick={() => app.setKnowledge(app.knowledge.filter((k) => k.id !== item.id))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <p className="whitespace-pre-wrap text-sm text-slate-300">{item.content}</p>
        </DarkCard>
      ))}
    </div>
  );
}