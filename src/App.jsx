import { lazy, Suspense, useState } from "react";
import { useMasterDot } from "./hooks/useMasterDot";
import { useTimeTracking } from "./hooks/useTimeTracking";
import { useConfirm } from "./hooks/useConfirm";
import MetaPulseLogo from "./components/common/MetaPulseLogo";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { ScreenSkeleton } from "./components/common/Skeleton";

import AppHeader from "./components/layout/AppHeader";
import BottomNav from "./components/layout/BottomNav";
import GlobalSearchSheet from "./components/layout/GlobalSearchSheet";
import LoginScreen from "./screens/LoginScreen";

import TaskDetailSheet from "./components/tasks/TaskDetailSheet";
import EditTaskSheet from "./components/tasks/EditTaskSheet";
import QuickAddSheet from "./components/tasks/QuickAddSheet";
import AddOptionsSheet from "./components/tasks/AddOptionsSheet";
import ImportPreviewSheet from "./components/tasks/ImportPreviewSheet";
import PageTransition from "./components/common/PageTransition";

import { Toaster } from "sonner";

const HomeScreen        = lazy(() => import("./screens/HomeScreen"));
const TasksScreen       = lazy(() => import("./screens/TasksScreen"));
const CalendarScreen    = lazy(() => import("./screens/CalendarScreen"));
const ProjectsScreen    = lazy(() => import("./screens/ProjectsScreen"));
const KanbanScreen      = lazy(() => import("./screens/KanbanScreen"));
const ProblemsScreen    = lazy(() => import("./screens/ProblemsScreen"));
const KnowledgeScreen   = lazy(() => import("./screens/KnowledgeScreen"));
const TimeTrackingScreen = lazy(() => import("./screens/TimeTrackingScreen"));
const FocusScreen       = lazy(() => import("./screens/FocusScreen"));
const SettingsScreen    = lazy(() => import("./screens/SettingsScreen"));
const GanttScreen            = lazy(() => import("./screens/GanttScreen"));
const ResponsibleDashboardScreen = lazy(() => import("./screens/ResponsibleDashboardScreen"));
const KpiScreen                  = lazy(() => import("./screens/KpiScreen"));

export default function App() {
  const { confirm, ConfirmNode } = useConfirm();
  const app = useMasterDot({ confirm });
  const tt  = useTimeTracking({ confirm, userId: app.userId });
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);

  if (!app.loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <MetaPulseLogo iconSize={72} layout="icon" />
            <div className="absolute -inset-2 animate-spin rounded-[28px] border-2 border-blue-500 border-t-transparent" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-white">Meta</span><span className="text-blue-400">Pulse</span>
            </h1>
            <p className="text-sm text-slate-400">Inicializando...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!app.userId) {
    return <LoginScreen app={app} />;
  }

  const screens = {
    home:         <HomeScreen app={app} />,
    tasks:        <TasksScreen app={app} />,
    calendar:     <CalendarScreen app={app} />,
    projects:     <ProjectsScreen app={app} />,
    kanban:       <KanbanScreen app={app} />,
    problems:     <ProblemsScreen app={app} />,
    knowledge:    <KnowledgeScreen app={app} />,
    timetracking: <TimeTrackingScreen tt={tt} />,
    focus:        <FocusScreen app={app} />,
    settings:     <SettingsScreen app={app} />,
    gantt:        <GanttScreen app={app} />,
    responsible:  <ResponsibleDashboardScreen app={app} />,
    kpi:          <KpiScreen app={app} />,
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#0f172a,_#020617_55%)] text-slate-100">
        <div className="mx-auto flex min-h-screen max-w-md flex-col bg-transparent">
          <AppHeader
            activeTab={app.activeTab}
            setActiveTab={app.setActiveTab}
            isOnline={app.isOnline}
            onSearchOpen={() => setShowGlobalSearch(true)}
          />

          {app.cloudError && (
            <div className="flex items-center gap-2 border-b border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-300">
              <span className="flex-1">{app.cloudError}</span>
              <button
                onClick={() => app.setCloudError(null)}
                className="shrink-0 text-red-400 hover:text-red-200"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>
          )}

          <main className="flex-1 overflow-y-auto px-4 pb-32 pt-4">
            <ErrorBoundary>
              <Suspense fallback={<ScreenSkeleton />}>
                <PageTransition key={app.activeTab}>
                  {screens[app.activeTab] || screens.home}
                </PageTransition>
              </Suspense>
            </ErrorBoundary>
          </main>

          <BottomNav
            activeTab={app.activeTab}
            setActiveTab={app.setActiveTab}
            onAddClick={() => app.setShowAddOptions(true)}
          />

          {app.showAddOptions && <AddOptionsSheet app={app} />}
          {app.showQuickAdd && <QuickAddSheet app={app} />}
          {app.importPreview && <ImportPreviewSheet app={app} />}
          {app.editingTask && <EditTaskSheet app={app} />}
          {app.selectedTaskId && <TaskDetailSheet app={app} />}
        </div>

        <Toaster position="top-center" richColors closeButton duration={2500} />
        {showGlobalSearch && (
          <GlobalSearchSheet app={app} onClose={() => setShowGlobalSearch(false)} />
        )}
      </div>

      {ConfirmNode}
    </ErrorBoundary>
  );
}
