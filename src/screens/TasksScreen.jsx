import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import SelectField from "../components/common/SelectField";
import TaskTree from "../components/tasks/TaskTree";

export default function TasksScreen({ app }) {
  return (
    <div className="space-y-4">
      <Card className="rounded-3xl border border-slate-800 bg-slate-900 shadow-sm">
        <CardContent className="space-y-3 p-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <Input
              className="h-11 rounded-2xl border-slate-700 bg-slate-950 pl-9 text-slate-100 placeholder:text-slate-500"
              placeholder="Buscar atividade"
              value={app.search}
              onChange={(e) => app.setSearch(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <SelectField
              value={app.statusFilter}
              onChange={app.setStatusFilter}
              options={["Todos", "Aberto", "Em andamento", "Aguardando", "Concluído"]}
            />

            <SelectField
              value={app.priorityFilter}
              onChange={app.setPriorityFilter}
              options={["Todas", "Alta", "Média", "Baixa"]}
            />
          </div>
        </CardContent>
      </Card>

      <TaskTree app={app} tasks={app.filteredMainTasks} />
    </div>
  );
}