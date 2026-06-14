import { useState } from "react";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import TextareaDark from "../common/TextareaDark";
import VoiceMicButton from "../common/VoiceMicButton";

export default function CommentBlock({ app, task, compact = false }) {
  const comments = task.comments || [];
  const isEditing = app.commentForm.taskId === task.id;

  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");

  if (compact && comments.length === 0 && !isEditing) return null;

  function startEdit(comment) {
    setEditingId(comment.id);
    setEditingText(comment.text);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingText("");
  }

  async function saveEdit(commentId) {
    await app.updateTaskComment(task.id, commentId, editingText);
    cancelEdit();
  }

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
          onClick={() =>
            app.setCommentForm({
              taskId: task.id,
              text: "",
            })
          }
        >
          + Comentar
        </Button>
      </div>

      {comments.length > 0 && (
        <div className="mt-2 space-y-2">
          {comments
            .slice()
            .reverse()
            .map((comment) => {
              const editing = editingId === comment.id;

              return (
                <div
                  key={comment.id}
                  className="rounded-xl bg-slate-900 p-2"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[11px] text-slate-500">
                        {comment.date}
                      </p>

                      {comment.editedAt && (
                        <p className="text-[10px] text-slate-600">
                          Editado em {comment.editedAt}
                        </p>
                      )}
                    </div>

                    {!editing && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(comment)}
                          className="text-slate-400"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() =>
                            app.deleteTaskComment(task.id, comment.id)
                          }
                          className="text-slate-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {editing ? (
                    <div className="space-y-2">
                      <TextareaDark
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          className="rounded-2xl border-slate-700 bg-slate-950 text-slate-100"
                          onClick={cancelEdit}
                        >
                          <X className="mr-1 h-4 w-4" />
                          Cancelar
                        </Button>

                        <Button
                          className="rounded-2xl bg-slate-100 text-slate-950"
                          onClick={() => saveEdit(comment.id)}
                        >
                          <Check className="mr-1 h-4 w-4" />
                          Salvar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-slate-300">
                      {comment.text}
                    </p>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {isEditing && (
        <div className="mt-3 space-y-2">
          <div className="relative">
            <TextareaDark
              placeholder="Digite o andamento..."
              value={app.commentForm.text}
              onChange={(e) =>
                app.setCommentForm({
                  ...app.commentForm,
                  text: e.target.value,
                })
              }
            />
            <div className="absolute bottom-2 right-2">
              <VoiceMicButton
                onResult={(t) =>
                  app.setCommentForm((prev) => ({
                    ...prev,
                    text: prev.text ? prev.text + " " + t : t,
                  }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="rounded-2xl border-slate-700 bg-slate-900 text-slate-100"
              onClick={() =>
                app.setCommentForm({
                  taskId: null,
                  text: "",
                })
              }
            >
              Cancelar
            </Button>

            <Button
              className="rounded-2xl bg-slate-100 text-slate-950"
              onClick={() =>
                app.addTaskComment(task.id, app.commentForm.text)
              }
            >
              Salvar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}