import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import InputDark from "../common/InputDark";
import { Badge } from "@/components/ui/badge";

export default function ChecklistBlock({ app, task, compact = false }) {
  const checklist = task.checklist || [];
  const done = checklist.filter((item) => item.done).length;
  const isAdding = app.checklistForm.taskId === task.id;

  if (compact && checklist.length === 0 && !isAdding) return null;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Checklist
        </p>

        <Badge variant="outline" className="rounded-full border-slate-700 text-slate-300">
          {done}/{checklist.length}
        </Badge>
      </div>

      {checklist.length > 0 && (
        <div className="mt-2 space-y-2">
          {checklist.map((item) => (
            <div key={item.id} className="flex items-center gap-2 rounded-xl bg-slate-900 p-2">
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => app.toggleChecklistItem(task.id, item.id)}
                className="h-4 w-4"
              />

              <span className={`flex-1 text-sm ${item.done ? "text-slate-500 line-through" : "text-slate-200"}`}>
                {item.text}
              </span>

              <button onClick={() => app.deleteChecklistItem(task.id, item.id)} className="text-slate-500">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {isAdding ? (
        <div className="mt-3 space-y-2">
          <InputDark
            placeholder="Novo item"
            value={app.checklistForm.text}
            onChange={(e) =>
              app.setChecklistForm({ ...app.checklistForm, text: e.target.value })
            }
          />

          <Button
            className="h-10 w-full rounded-2xl bg-slate-100 text-slate-950"
            onClick={() => app.addChecklistItem(task.id, app.checklistForm.text)}
          >
            Adicionar
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 h-8 rounded-xl px-2 text-xs text-slate-300 hover:bg-slate-800"
          onClick={() => app.setChecklistForm({ taskId: task.id, text: "" })}
        >
          + Item checklist
        </Button>
      )}
    </div>
  );
}