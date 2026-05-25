import TaskItem from "../components/tasks/TaskItem";

export default function KanbanScreen({ app }) {
  const columns = ["Aberto", "Em andamento", "Aguardando", "Concluído"];

  return (
    <div className="space-y-4">
      {columns.map((status) => {
        const tasks = app.tasks.filter((task) => task.status === status && task.parentId === null);

        return (
          <div key={status} className="space-y-3">
            <h2 className="px-1 text-base font-semibold text-white">
              {status} <span className="text-slate-500">({tasks.length})</span>
            </h2>

            {tasks.length === 0 ? (
              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-500">
                Nenhuma atividade.
              </div>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
                  <TaskItem app={app} task={task} compact />
                </div>
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}