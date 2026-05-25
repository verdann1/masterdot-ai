import Empty from "../common/Empty";
import DarkCard from "../common/DarkCard";
import TaskItem from "./TaskItem";

export default function TaskTree({ app, tasks, compact = false }) {
  if (!tasks.length) return <Empty text="Nenhuma atividade encontrada." />;

  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const children = app.getChildren(task.id);
        const progress = app.getProgress(task.id);

        return (
          <DarkCard key={task.id}>
            <TaskItem app={app} task={task} progress={progress} compact={compact} />

            {children.length > 0 && (
              <div className="mt-3 space-y-2 border-l-2 border-slate-800 pl-3">
                {children.map((child) => (
                  <div key={child.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
                    <TaskItem app={app} task={child} compact={compact} child />
                  </div>
                ))}
              </div>
            )}
          </DarkCard>
        );
      })}
    </div>
  );
}