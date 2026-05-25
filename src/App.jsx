import { useMasterDot } from "./hooks/useMasterDot";

import AppHeader from "./components/layout/AppHeader";
import BottomNav from "./components/layout/BottomNav";

import HomeScreen from "./screens/HomeScreen";
import TasksScreen from "./screens/TasksScreen";
import CalendarScreen from "./screens/CalendarScreen";
import ProjectsScreen from "./screens/ProjectsScreen";
import KanbanScreen from "./screens/KanbanScreen";
import ProblemsScreen from "./screens/ProblemsScreen";
import KnowledgeScreen from "./screens/KnowledgeScreen";
import SettingsScreen from "./screens/SettingsScreen";
import LoginScreen from "./screens/LoginScreen";
import AiAssistantScreen from "./screens/AiAssistantScreen";

import TaskDetailSheet from "./components/tasks/TaskDetailSheet";
import EditTaskSheet from "./components/tasks/EditTaskSheet";
import QuickAddSheet from "./components/tasks/QuickAddSheet";
import AddOptionsSheet from "./components/tasks/AddOptionsSheet";

export default function App() {
  const app = useMasterDot();

  if (!app.loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-center">
          <div className="mx-auto mb-4 h-14 w-14 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
          <h1 className="text-xl font-bold">Master DOT</h1>
          <p className="text-sm text-slate-400">Inicializando...</p>
        </div>
      </div>
    );
  }

  if (!app.userId) {
    return <LoginScreen app={app} />;
  }

  const screens = {
    home: <HomeScreen app={app} />,
    tasks: <TasksScreen app={app} />,
    calendar: <CalendarScreen app={app} />,
    projects: <ProjectsScreen app={app} />,
    kanban: <KanbanScreen app={app} />,
    problems: <ProblemsScreen app={app} />,
    knowledge: <KnowledgeScreen app={app} />,
    ai: <AiAssistantScreen app={app} />,
    settings: <SettingsScreen app={app} />,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-md flex-col bg-slate-950">
        <AppHeader activeTab={app.activeTab} setActiveTab={app.setActiveTab} />

        <main className="flex-1 space-y-4 overflow-y-auto px-4 pb-28 pt-4">
          {screens[app.activeTab] || screens.home}
        </main>

        <BottomNav
          activeTab={app.activeTab}
          setActiveTab={app.setActiveTab}
          onAddClick={() => app.setShowAddOptions(true)}
        />

        {app.showAddOptions && <AddOptionsSheet app={app} />}
        {app.showQuickAdd && <QuickAddSheet app={app} />}
        {app.editingTask && <EditTaskSheet app={app} />}
        {app.selectedTaskId && <TaskDetailSheet app={app} />}
      </div>
    </div>
  );
}