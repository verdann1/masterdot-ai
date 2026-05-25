import { Button } from "@/components/ui/button";
import TextareaDark from "../common/TextareaDark";

export default function CommentBlock({ app, task, compact = false }) {
  const comments = task.comments || [];
  const isEditing = app.commentForm.taskId === task.id;

  if (compact && comments.length === 0 && !isEditing) return null;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Histórico
        </p>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 rounded-xl px-2 text-xs text-slate-300 hover:bg-slate-800"
          onClick={() => app.setCommentForm({ taskId: task.id, text: "" })}
        >
          + Comentar
        </Button>
      </div>

      {comments.length > 0 && (
        <div className="mt-2 space-y-2">
          {comments.slice().reverse().map((comment) => (
            <div key={comment.id} className="rounded-xl bg-slate-900 p-2">
              <p className="text-[11px] text-slate-500">{comment.date}</p>
              <p className="mt-1 text-sm text-slate-300">{comment.text}</p>
            </div>
          ))}
        </div>
      )}

      {isEditing && (
        <div className="mt-3 space-y-2">
          <TextareaDark
            placeholder="Digite o andamento..."
            value={app.commentForm.text}
            onChange={(e) =>
              app.setCommentForm({ ...app.commentForm, text: e.target.value })
            }
          />

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="rounded-2xl border-slate-700 bg-slate-900 text-slate-100"
              onClick={() => app.setCommentForm({ taskId: null, text: "" })}
            >
              Cancelar
            </Button>

            <Button
              className="rounded-2xl bg-slate-100 text-slate-950"
              onClick={() => app.addTaskComment(task.id, app.commentForm.text)}
            >
              Salvar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}