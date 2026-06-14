import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  defaultProjects,
  initialKnowledge,
  initialProblems,
  initialTasks,
} from "../data/initialData";

import { todayISO } from "../utils/dateUtils";
import { loadAppData, saveAppData } from "../services/storageService";
import { captureEvidence } from "../services/evidenceService";
import {
  scheduleTaskNotifications,
  autoScheduleIfEnabled,
  isNotificationsEnabled,
  getTaskAlerts,
  getNotifDaysBefore,
  setNotifDaysBefore,
  isDailyBriefingEnabled,
  scheduleDailyBriefing,
  cancelDailyBriefing,
} from "../services/notificationService";
import { importTasksFromExcelFile } from "../services/excelService";
import { exportExecutivePdfReport, shareTaskAsPdf } from "../services/pdfReportService";
import { Share } from "@capacitor/share";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Preferences } from "@capacitor/preferences";
import { toast } from "sonner";

import {
  listenAuth,
  registerWithEmail,
  loginWithEmail,
  logoutUser,
  subscribeTasksPaged,
  fetchTasksPage,
  subscribeProjects,
  subscribeProblems,
  subscribeKnowledge,
  saveTaskCloud,
  deleteTaskCloud,
  saveProjectCloud,
  deleteProjectCloud,
  saveProblemCloud,
  deleteProblemCloud,
  saveKnowledgeCloud,
  deleteKnowledgeCloud,
  deleteEvidenceCloud,
  ensureMembership,
  subscribeMembers,
  subscribeInvites,
  updateMemberRole,
  updateMemberStatus,
  removeMember,
  createInvite,
  deleteInvite,
  migrateUserDataToWorkspace,
} from "../services/firebaseService";

import {
  exportTasksToExcel,
  exportExecutiveReport,
  shareTaskAsExcel,
} from "../services/exportService";

import { useTaskFilters } from "./useTaskFilters";

function isShareCancel(err) {
  const msg = (err?.message || err?.toString() || "").toLowerCase();
  return msg.includes("cancel") || msg.includes("dismiss") || msg.includes("abort");
}

function makeHistoryEntry(action, detail, by) {
  return {
    id: Date.now() + Math.random(),
    at: new Date().toLocaleString("pt-BR"),
    action,
    detail,
    by: by || null,
  };
}

export function useMasterDot({ confirm } = {}) {
  const confirmFn = confirm || ((msg) => Promise.resolve(window.confirm(msg)));
  const [loaded, setLoaded] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [member, setMember] = useState(null);   // { uid, email, name, role, status }
  const [members, setMembers] = useState([]);    // lista de membros (admin/gestor)
  const [invites, setInvites] = useState([]);    // convites pendentes
  const [dailyBriefingEnabled, setDailyBriefingEnabledState] = useState(() => isDailyBriefingEnabled());
  const [notifDaysBefore, setNotifDaysBeforeState] = useState(() => getNotifDaysBefore());

  const [activeTab, setActiveTab] = useState("home");

  const [tasks, setTasks] = useState(initialTasks);
  const [problems, setProblems] = useState(initialProblems);
  const [knowledge, setKnowledge] = useState(initialKnowledge);
  const [projects, setProjects] = useState(defaultProjects);

  const [showAddOptions, setShowAddOptions] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickMode, setQuickMode] = useState("task");

  const [editingTask, setEditingTask] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [editingProblem, setEditingProblem] = useState(null);
  const [editingKnowledge, setEditingKnowledge] = useState(null);

  const [saving, setSaving] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cloudError, setCloudError] = useState(null);
  const [lastTaskDoc, setLastTaskDoc] = useState(null);
  const [hasMoreTasks, setHasMoreTasks] = useState(false);
  const [loadingMoreTasks, setLoadingMoreTasks] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [expandedTaskIds, setExpandedTaskIds] = useState([]);

  const [commentForm, setCommentForm] = useState({ taskId: null, text: "" });
  const [checklistForm, setChecklistForm] = useState({ taskId: null, text: "" });

  const [importPreview, setImportPreview] = useState(null);
  const [importingExcel, setImportingExcel] = useState(false);

  const [authForm, setAuthForm] = useState({
    email: "",
    password: "",
  });

  const [taskForm, setTaskForm] = useState({
    title: "",
    parentId: "",
    project: "Rotina diária",
    priority: "Média",
    status: "Aberto",
    startDate: "",
    endDate: "",
    responsibles: [],
    notes: "",
    progressComment: "",
    progress: 0,
  });

  const [projectForm, setProjectForm] = useState({
    name: "",
    color: "blue",
  });

  const [problemForm, setProblemForm] = useState({
    project: "",
    taskId: "",
    product: "",
    line: "",
    problem: "",
    cause: "",
    action: "",
    responsible: "",
    due: "",
  });

  const [knowledgeForm, setKnowledgeForm] = useState({
    category: "Geral",
    title: "",
    content: "",
  });

  // Auto-reschedule notifications once after tasks load (if previously enabled)
  const hasAutoScheduled = useRef(false);
  useEffect(() => {
    if (!loaded || hasAutoScheduled.current || tasks.length === 0) return;
    hasAutoScheduled.current = true;
    autoScheduleIfEnabled(tasks);
  }, [loaded, tasks]);

  useEffect(() => {
    const up = () => { setIsOnline(true); setCloudError(null); };
    const down = () => setIsOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  useEffect(() => {
    let unsubscribeTasks = null;
    let unsubscribeProjects = null;
    let unsubscribeProblems = null;
    let unsubscribeKnowledge = null;
    let unsubscribeMembers = null;
    let unsubscribeInvites = null;

    const handleCloudError = () => {
      setCloudError("Falha ao sincronizar com a nuvem. Verifique sua conexão.");
    };

    async function init() {
      const saved = await loadAppData();

      if (saved) {
        setTasks(saved.tasks || []);
        setProblems(saved.problems || []);
        setKnowledge(saved.knowledge || []);
        setProjects(saved.projects || defaultProjects);
      }

      const unsubscribeAuth = listenAuth(async (user) => {
        if (unsubscribeTasks) unsubscribeTasks();
        if (unsubscribeProjects) unsubscribeProjects();
        if (unsubscribeProblems) unsubscribeProblems();
        if (unsubscribeKnowledge) unsubscribeKnowledge();
        if (unsubscribeMembers) unsubscribeMembers();
        if (unsubscribeInvites) unsubscribeInvites();

        if (!user) {
          setUserId(null);
          setUserEmail(null);
          setMember(null);
          setMembers([]);
          setInvites([]);
          setLoaded(true);
          return;
        }

        setUserId(user.uid);
        setUserEmail(user.email || null);

        // Resolve membership/papel. pending/sem acesso => não assina dados.
        let membership = null;
        try {
          membership = await ensureMembership(user);
        } catch (e) {
          console.error("Falha ao resolver membership:", e);
        }
        setMember(membership);

        if (!membership || membership.status !== "active") {
          setLoaded(true);
          return;
        }

        const isManager = membership.role === "admin" || membership.role === "gestor";

        // Lista de membros/convites para a tela de Equipe (admin/gestor)
        if (isManager) {
          unsubscribeMembers = subscribeMembers(setMembers, () => {});
          unsubscribeInvites = subscribeInvites(setInvites, () => {});
        }

        // Migração one-time dos dados em nuvem do admin para o workspace compartilhado
        if (membership.role === "admin") {
          const migFlag = `masterdot_migrated_${user.uid}`;
          if (!localStorage.getItem(migFlag)) {
            try {
              const copied = await migrateUserDataToWorkspace(user.uid);
              localStorage.setItem(migFlag, "1");
              if (copied > 0) toast.success(`${copied} item(ns) migrado(s) para o workspace.`);
            } catch (e) {
              console.warn("Migração para workspace falhou (segue normal):", e);
            }
          }
        }

        // One-time sync: push existing local data to Firebase on first login
        const syncFlag = `masterdot_synced_${user.uid}`;
        if (!localStorage.getItem(syncFlag) && saved) {
          localStorage.setItem(syncFlag, "1");
          const localTasks = saved.tasks || [];
          const localProjects = saved.projects || [];
          const localProblems = saved.problems || [];
          const localKnowledge = saved.knowledge || [];
          const total = localTasks.length + localProjects.length + localProblems.length + localKnowledge.length;
          if (total > 0) {
            (async () => {
              try {
                toast.info("Sincronizando dados locais com a nuvem...", { duration: 4000 });
                const BATCH = 10;
                const syncs = [
                  ...localTasks.map((t) => () => saveTaskCloud(user.uid, t)),
                  ...localProjects.map((p) => () => saveProjectCloud(user.uid, p)),
                  ...localProblems.map((p) => () => saveProblemCloud(user.uid, p)),
                  ...localKnowledge.map((k) => () => saveKnowledgeCloud(user.uid, k)),
                ];
                for (let i = 0; i < syncs.length; i += BATCH) {
                  await Promise.all(syncs.slice(i, i + BATCH).map((fn) => fn()));
                }
                toast.success(`${total} item(s) sincronizado(s) com a nuvem.`);
              } catch {
                toast.warning("Falha na sincronização inicial. Tente novamente.");
                localStorage.removeItem(syncFlag);
              }
            })();
          }
        }

        // Paginated real-time subscription (50 most recent tasks)
        unsubscribeTasks = subscribeTasksPaged(user.uid, (cloudTasks, lastDoc, hasMore) => {
          if (cloudTasks.length > 0) {
            setCloudError(null);
            setTasks((prev) => {
              const prevMap = new Map(prev.map((t) => [String(t.id), t]));
              const freshIds = new Set(cloudTasks.map((t) => String(t.id)));
              // Merge: cloud wins for all fields, but preserve local evidences
              // (dataUrl is not stored in Firestore due to 1MB doc limit)
              const merged = cloudTasks.map((cloudTask) => {
                const local = prevMap.get(String(cloudTask.id));
                if (local?.evidences?.length) {
                  return { ...cloudTask, evidences: local.evidences };
                }
                return cloudTask;
              });
              const olderTasks = prev.filter((t) => !freshIds.has(String(t.id)));
              return [...merged, ...olderTasks];
            });
          }
          setLastTaskDoc(lastDoc);
          setHasMoreTasks(hasMore);
        }, handleCloudError);

        unsubscribeProjects = subscribeProjects(user.uid, (cloudProjects) => {
          if (cloudProjects.length > 0) {
            setCloudError(null);
            setProjects(cloudProjects);
          }
        }, handleCloudError);

        unsubscribeProblems = subscribeProblems(user.uid, (cloudProblems) => {
          if (cloudProblems.length > 0) {
            setCloudError(null);
            setProblems(cloudProblems);
          }
        }, handleCloudError);

        unsubscribeKnowledge = subscribeKnowledge(user.uid, (cloudKnowledge) => {
          if (cloudKnowledge.length > 0) {
            setCloudError(null);
            setKnowledge(cloudKnowledge);
          }
        }, handleCloudError);

        setLoaded(true);
      });

      return unsubscribeAuth;
    }

    const unsubscribeAuthPromise = init();

    return () => {
      Promise.resolve(unsubscribeAuthPromise).then((unsubscribeAuth) => {
        if (typeof unsubscribeAuth === "function") unsubscribeAuth();
      });

      if (unsubscribeTasks) unsubscribeTasks();
      if (unsubscribeProjects) unsubscribeProjects();
      if (unsubscribeProblems) unsubscribeProblems();
      if (unsubscribeKnowledge) unsubscribeKnowledge();
      if (unsubscribeMembers) unsubscribeMembers();
      if (unsubscribeInvites) unsubscribeInvites();
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    saveAppData({ tasks, problems, knowledge, projects });
  }, [tasks, problems, knowledge, projects, loaded]);

  // Write summary to SharedPreferences so the Android widget can read it
  useEffect(() => {
    if (!loaded || !tasks.length) return;
    const today = todayISO();
    const summary = {
      total: tasks.length,
      inProgress: tasks.filter((t) => t.status === "Em andamento").length,
      late: tasks.filter((t) => t.status !== "Concluído" && t.endDate && t.endDate < today).length,
      done: tasks.filter((t) => t.status === "Concluído").length,
      updated: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };
    Preferences.set({ key: "widget_data", value: JSON.stringify(summary) }).catch(() => {});
  }, [tasks, loaded]);

  const today = todayISO();

  const mainTasks = useMemo(() => {
    return tasks.filter((task) => task.parentId === null);
  }, [tasks]);

  const dashboard = useMemo(() => {
    const openTasks = tasks.filter((task) => task.status !== "Concluído");

    const todayTasks = openTasks.filter(
      (task) => task.startDate <= today && task.endDate >= today
    );

    const late = openTasks.filter(
      (task) => task.endDate && task.endDate < today
    );

    const critical = openTasks.filter((task) => task.priority === "Alta");

    return {
      openTasks,
      todayTasks,
      late,
      critical,
    };
  }, [tasks, today]);

  const filters = useTaskFilters({
    mainTasks,
    problems,
    identity: { userId, email: userEmail, name: member?.name },
  });

  function getChildren(parentId) {
    return tasks.filter((task) => task.parentId === parentId);
  }

  function getProgress(parentId) {
    const children = getChildren(parentId);

    if (!children.length) {
      return {
        done: 0,
        total: 0,
        percent: 0,
      };
    }

    const done = children.filter((item) => item.status === "Concluído").length;

    return {
      done,
      total: children.length,
      percent: Math.round((done / children.length) * 100),
    };
  }

  async function loginUser() {
    if (!authForm.email || !authForm.password) {
      toast.warning("Informe e-mail e senha.");
      return;
    }

    try {
      await loginWithEmail(authForm.email, authForm.password);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao entrar. Verifique e-mail e senha.");
    }
  }

  async function registerUser() {
    if (!authForm.email || !authForm.password) {
      toast.warning("Informe e-mail e senha.");
      return;
    }

    try {
      await registerWithEmail(authForm.email, authForm.password);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao criar conta.");
    }
  }

  async function logout() {
    await logoutUser();
    setUserId(null);
  }

  async function addTask() {
    if (saving) return;

    const title = taskForm.title.trim();

    if (!title) {
      toast.warning("Informe o título da atividade.");
      return;
    }

    if (!taskForm.startDate) {
      toast.warning("Informe a data de início.");
      return;
    }

    if (!taskForm.endDate) {
      toast.warning("Informe a data de fim.");
      return;
    }

    if (taskForm.endDate < taskForm.startDate) {
      toast.error("A data de fim não pode ser menor que a data de início.");
      return;
    }

    const duplicated = tasks.some(
      (task) =>
        task.title.trim().toLowerCase() === title.toLowerCase() &&
        task.project === taskForm.project
    );

    if (duplicated) {
      toast.warning("Já existe uma atividade com este título neste projeto.");
      return;
    }

    setSaving(true);

    try {
      const isSubtask = taskForm.parentId !== "";

      const parentTask = isSubtask
        ? tasks.find((task) => task.id === Number(taskForm.parentId))
        : null;

      const comment = taskForm.progressComment
        ? [
            {
              id: Date.now() + 1,
              date: new Date().toLocaleString("pt-BR"),
              text: taskForm.progressComment,
            },
          ]
        : [];

      const newTask = {
        id: Date.now(),
        parentId: isSubtask ? Number(taskForm.parentId) : null,
        title,
        project: parentTask ? parentTask.project : taskForm.project,
        priority: taskForm.priority,
        status: taskForm.status,
        startDate: taskForm.startDate,
        endDate: taskForm.endDate,
        responsibles: taskForm.responsibles,
        responsible: taskForm.responsibles[0] || "",
        type: isSubtask ? "Subatividade" : "Atividade Primária",
        notes: taskForm.notes,
        progressComment: taskForm.progressComment,
        progress: taskForm.progress ?? 0,
        comments: comment,
        evidences: [],
        checklist: [],
        createdBy: userId || null,
        createdByEmail: userEmail || null,
      };

      const tasksAfterAdd = [newTask, ...tasks];
      setTasks(tasksAfterAdd);

      if (userId) {
        try {
          await saveTaskCloud(userId, newTask);
        } catch (error) {
          console.warn(
            "Atividade salva localmente, mas falhou ao sincronizar na nuvem.",
            error
          );
        }
      }

      setTaskForm({
        title: "",
        parentId: "",
        project: "Rotina diária",
        priority: "Média",
        status: "Aberto",
        startDate: "",
        endDate: "",
        responsibles: [],
        notes: "",
        progressComment: "",
        progress: 0,
      });

      setShowQuickAdd(false);
      setShowAddOptions(false);
      setSelectedTaskId(newTask.id);
      setActiveTab("tasks");

      autoScheduleIfEnabled(tasksAfterAdd);
      toast.success("Atividade salva com sucesso.");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar atividade.");
    }

    setSaving(false);
  }

  async function updateTaskStatus(id, status) {
    let updatedTask = null;

    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== id) return task;
        updatedTask = {
          ...task,
          status,
          history: [...(task.history || []), makeHistoryEntry("status", `${task.status} → ${status}`, member?.name || userEmail)],
        };
        return updatedTask;
      })
    );

    if (userId && updatedTask) {
      try {
        await saveTaskCloud(userId, updatedTask);
      } catch (error) {
        console.warn("Status atualizado localmente, mas falhou na nuvem.", error);
      }
    }

    toast.success("Status atualizado.");
  }

  async function saveEditedTask() {
    if (!editingTask?.title?.trim()) {
      toast.warning("Informe o título da atividade.");
      return;
    }

    const original = tasks.find((t) => t.id === editingTask.id);
    const entries = [];
    if (original) {
      if (original.status !== editingTask.status) entries.push(`Status: ${original.status} → ${editingTask.status}`);
      if (original.priority !== editingTask.priority) entries.push(`Prioridade: ${original.priority} → ${editingTask.priority}`);
      if (original.endDate !== editingTask.endDate) entries.push(`Prazo: ${original.endDate} → ${editingTask.endDate}`);
      if ((original.progress ?? 0) !== (editingTask.progress ?? 0)) entries.push(`Progresso: ${original.progress ?? 0}% → ${editingTask.progress ?? 0}%`);
      if (original.title.trim() !== editingTask.title.trim()) entries.push("Título alterado");
    }

    const taskToSave = entries.length > 0
      ? { ...editingTask, history: [...(editingTask.history || []), makeHistoryEntry("edit", entries.join(" · "), member?.name || userEmail)] }
      : editingTask;

    const tasksAfterEdit = tasks.map((task) => (task.id === taskToSave.id ? taskToSave : task));
    setTasks(tasksAfterEdit);

    if (userId) {
      try {
        await saveTaskCloud(userId, taskForCloud(taskToSave));
      } catch (error) {
        console.warn("Atividade editada localmente, mas falhou na nuvem.", error);
      }
    }

    setEditingTask(null);
    autoScheduleIfEnabled(tasksAfterEdit);
    toast.success("Atividade atualizada.");
  }

  async function deleteTask(id) {
    const ok = await confirmFn(
      "As subatividades também serão excluídas.",
      "Excluir atividade?"
    );
    if (!ok) return;

    const children = tasks.filter((task) => task.parentId === id);

    setTasks((prev) =>
      prev.filter((task) => task.id !== id && task.parentId !== id)
    );

    if (userId) {
      try {
        await deleteTaskCloud(userId, id);

        for (const child of children) {
          await deleteTaskCloud(userId, child.id);
        }
      } catch (error) {
        console.warn("Falha ao excluir da nuvem.", error);
      }
    }

    setSelectedTaskId(null);
    toast.success("Atividade excluída.");
  }

  async function addTaskComment(taskId, text) {
    if (!text.trim()) {
      toast.warning("Digite um comentário.");
      return;
    }

    const current = tasks.find((task) => task.id === taskId);
    if (!current) return;

    const newComment = {
      id: Date.now(),
      date: new Date().toLocaleString("pt-BR"),
      text: text.trim(),
    };

    const updatedTask = {
      ...current,
      progressComment: text.trim(),
      comments: [...(current.comments || []), newComment],
      history: [...(current.history || []), makeHistoryEntry("comment", text.trim().slice(0, 100), member?.name || userEmail)],
    };

    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? updatedTask : task))
    );

    if (userId) {
      try {
        await saveTaskCloud(userId, updatedTask);
      } catch (error) {
        console.warn("Comentário salvo localmente, mas falhou na nuvem.", error);
      }
    }

    setCommentForm({
      taskId: null,
      text: "",
    });

    toast.success("Comentário salvo.");
  }

  async function addChecklistItem(taskId, text) {
    if (!text.trim()) {
      toast.warning("Digite um item para o checklist.");
      return;
    }

    const current = tasks.find((task) => task.id === taskId);
    if (!current) return;

    const item = {
      id: Date.now(),
      text: text.trim(),
      done: false,
    };

    const updatedTask = {
      ...current,
      checklist: [...(current.checklist || []), item],
    };

    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? updatedTask : task))
    );

    if (userId) {
      try {
        await saveTaskCloud(userId, updatedTask);
      } catch (error) {
        console.warn("Checklist salvo localmente, mas falhou na nuvem.", error);
      }
    }

    setChecklistForm({
      taskId: null,
      text: "",
    });

    toast.success("Item adicionado ao checklist.");
  }

  async function toggleChecklistItem(taskId, itemId) {
    const current = tasks.find((task) => task.id === taskId);
    if (!current) return;

    const updatedTask = {
      ...current,
      checklist: (current.checklist || []).map((item) =>
        item.id === itemId ? { ...item, done: !item.done } : item
      ),
    };

    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? updatedTask : task))
    );

    if (userId) {
      try {
        await saveTaskCloud(userId, updatedTask);
      } catch (error) {
        console.warn("Checklist atualizado localmente, mas falhou na nuvem.", error);
      }
    }

    toast.success("Checklist atualizado.");
  }

  async function updateChecklistItem(taskId, itemId, text) {
    if (!text.trim()) {
      toast.warning("Digite o texto do item.");
      return;
    }

    const current = tasks.find((task) => task.id === taskId);
    if (!current) return;

    const updatedTask = {
      ...current,
      checklist: (current.checklist || []).map((item) =>
        item.id === itemId
          ? {
              ...item,
              text: text.trim(),
            }
          : item
      ),
    };

    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? updatedTask : task))
    );

    if (userId) {
      try {
        await saveTaskCloud(userId, updatedTask);
      } catch (error) {
        console.warn("Checklist editado localmente, mas falhou na nuvem.", error);
      }
    }

    toast.success("Item do checklist atualizado.");
  }

  async function deleteChecklistItem(taskId, itemId) {
    const current = tasks.find((task) => task.id === taskId);
    if (!current) return;

    const updatedTask = {
      ...current,
      checklist: (current.checklist || []).filter((item) => item.id !== itemId),
    };

    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? updatedTask : task))
    );

    if (userId) {
      try {
        await saveTaskCloud(userId, updatedTask);
      } catch (error) {
        console.warn("Item removido localmente, mas falhou na nuvem.", error);
      }
    }

    toast.success("Item removido do checklist.");
  }

  // Strip base64 dataUrl from evidences before saving to Firestore
  // (Firestore has a 1MB document limit — base64 images can easily exceed it)
  function taskForCloud(task) {
    if (!task.evidences?.length) return task;
    return {
      ...task,
      evidences: task.evidences.map(({ dataUrl, ...rest }) => rest),
    };
  }

  async function attachEvidence(taskId) {
    const current = tasks.find((task) => task.id === taskId);

    if (!current) {
      toast.error("Atividade não encontrada.");
      return;
    }

    try {
      toast.info("Abrindo câmera/galeria...");

      const localEvidence = await captureEvidence();

      if (!localEvidence?.dataUrl) {
        toast.warning("Nenhuma imagem retornada pela câmera.");
        return;
      }

      const finalEvidence = {
        id: Date.now(),
        type: "image",
        date: new Date().toLocaleString("pt-BR"),
        dataUrl: localEvidence.dataUrl,
      };

      const updatedTask = {
        ...current,
        evidences: [...(current.evidences || []), finalEvidence],
      };

      const tasksAfterEvidence = tasks.map((task) =>
        task.id === taskId ? updatedTask : task
      );

      setTasks(tasksAfterEvidence);

      // Persist locally (with dataUrl for display)
      await saveAppData({ tasks: tasksAfterEvidence, problems, knowledge, projects });

      // Persist to Firestore without dataUrl (Firestore 1MB doc limit)
      if (userId) {
        try {
          await saveTaskCloud(userId, taskForCloud(updatedTask));
        } catch (error) {
          console.warn("Falha ao sincronizar evidência na nuvem.", error);
        }
      }

      toast.success("Evidência anexada.");
    } catch (error) {
      console.error("Erro ao anexar evidência:", error);
      toast.error(`Erro ao anexar evidência: ${error.message || "desconhecido"}`);
    }
  }

  async function removeEvidence(taskId, evidenceId) {
    const current = tasks.find((task) => task.id === taskId);
    if (!current) return;

    const evidence = (current.evidences || []).find(
      (item) => item.id === evidenceId
    );

    if (userId && evidence?.path) {
      await deleteEvidenceCloud(evidence.path);
    }

    const updatedTask = {
      ...current,
      evidences: (current.evidences || []).filter(
        (item) => item.id !== evidenceId
      ),
    };

    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? updatedTask : task))
    );

    if (userId) {
      await saveTaskCloud(userId, taskForCloud(updatedTask));
    }
  }

  async function addProject() {
    if (!projectForm.name.trim()) return;

    const newProject = {
      id: Date.now(),
      ...projectForm,
    };

    setProjects((prev) => [newProject, ...prev]);

    if (userId) {
      await saveProjectCloud(userId, newProject);
    }

    setProjectForm({
      name: "",
      color: "blue",
    });

    setShowQuickAdd(false);
  }

  async function updateProject(projectId, updates) {
    const currentProject = projects.find((project) => project.id === projectId);

    if (!currentProject) return;

    const oldName = currentProject.name;
    const newName = updates.name || oldName;

    const updatedProject = {
      ...currentProject,
      ...updates,
    };

    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId ? updatedProject : project
      )
    );

    if (newName !== oldName) {
      const updatedTasks = tasks.map((task) =>
        String(task.project || "").trim().toLowerCase() ===
        String(oldName || "").trim().toLowerCase()
          ? {
              ...task,
              project: newName,
            }
          : task
      );

      setTasks(updatedTasks);

      if (userId) {
        try {
          for (const task of updatedTasks) {
            if (
              String(task.project || "").trim().toLowerCase() ===
              String(newName || "").trim().toLowerCase()
            ) {
              await saveTaskCloud(userId, task);
            }
          }
        } catch (error) {
          console.warn("Projeto atualizado localmente, mas falhou nas atividades.", error);
        }
      }
    }

    if (userId) {
      try {
        await saveProjectCloud(userId, updatedProject);
      } catch (error) {
        console.warn("Projeto atualizado localmente, mas falhou na nuvem.", error);
      }
    }

    toast.success("Projeto atualizado.");
  }

  async function deleteProject(id) {
    const project = projects.find((item) => item.id === id);

    const linkedTasks = tasks.filter(
      (task) =>
        String(task.project || "").trim().toLowerCase() ===
        String(project?.name || "").trim().toLowerCase()
    );

    if (linkedTasks.length > 0) {
      toast.warning(
        "Não é possível excluir este projeto porque existem atividades vinculadas."
      );
      return;
    }

    const ok = await confirmFn("Deseja realmente excluir este projeto?", "Excluir projeto?");
    if (!ok) return;

    setProjects((prev) => prev.filter((project) => project.id !== id));

    if (userId) {
      try {
        await deleteProjectCloud(userId, id);
      } catch (error) {
        console.warn("Falha ao excluir projeto da nuvem.", error);
      }
    }

    toast.success("Projeto excluído.");
  }

  async function addProblem() {
    if (!problemForm.problem.trim()) return;

    const newProblem = {
      id: Date.now(),
      ...problemForm,
      createdAt: today,
    };

    setProblems((prev) => [newProblem, ...prev]);

    if (userId) {
      await saveProblemCloud(userId, newProblem);
    }

    setProblemForm({
      project: "",
      taskId: "",
      product: "",
      line: "",
      problem: "",
      cause: "",
      action: "",
      responsible: "",
      due: "",
    });

    setShowQuickAdd(false);
  }

  async function updateProblem(problemId, updates) {
    const updated = { ...problems.find((p) => p.id === problemId), ...updates };
    setProblems((prev) => prev.map((p) => (p.id === problemId ? updated : p)));
    if (userId) {
      try { await saveProblemCloud(userId, updated); } catch (e) { console.warn(e); }
    }
    toast.success("Problema atualizado.");
  }

  async function deleteProblem(id) {
    const ok = await confirmFn("Deseja realmente excluir este problema?", "Excluir problema?");
    if (!ok) return;

    setProblems((prev) => prev.filter((problem) => problem.id !== id));

    if (userId) {
      try {
        await deleteProblemCloud(userId, id);
      } catch (error) {
        console.warn("Falha ao excluir problema da nuvem.", error);
      }
    }

    toast.success("Problema excluído.");
  }

  async function addKnowledge() {
    if (!knowledgeForm.title.trim()) return;

    const newItem = {
      id: Date.now(),
      ...knowledgeForm,
      createdAt: today,
    };

    setKnowledge((prev) => [newItem, ...prev]);

    if (userId) {
      await saveKnowledgeCloud(userId, newItem);
    }

    setKnowledgeForm({
      category: "Geral",
      title: "",
      content: "",
    });

    setShowQuickAdd(false);
  }

  async function updateKnowledge(knowledgeId, updates) {
    const updated = { ...knowledge.find((k) => k.id === knowledgeId), ...updates };
    setKnowledge((prev) => prev.map((k) => (k.id === knowledgeId ? updated : k)));
    if (userId) {
      try { await saveKnowledgeCloud(userId, updated); } catch (e) { console.warn(e); }
    }
    toast.success("Registro atualizado.");
  }

  async function deleteKnowledge(id) {
    const ok = await confirmFn("Deseja realmente excluir este item da base?", "Excluir item?");
    if (!ok) return;

    setKnowledge((prev) => prev.filter((item) => item.id !== id));

    if (userId) {
      try {
        await deleteKnowledgeCloud(userId, id);
      } catch (error) {
        console.warn("Falha ao excluir item da nuvem.", error);
      }
    }

    toast.success("Item excluído.");
  }

  async function toggleDailyBriefing() {
    if (dailyBriefingEnabled) {
      await cancelDailyBriefing();
      setDailyBriefingEnabledState(false);
      toast.success("Resumo diário desativado.");
    } else {
      const ok = await scheduleDailyBriefing(tasks);
      if (ok) {
        setDailyBriefingEnabledState(true);
        toast.success("Resumo diário agendado às 7h.");
      } else {
        toast.error("Permissão de notificação necessária.");
      }
    }
  }

  function updateNotifDaysBefore(n) {
    setNotifDaysBefore(n);
    setNotifDaysBeforeState(n);
    if (isNotificationsEnabled()) scheduleTaskNotifications(tasks).catch(() => {});
  }

  async function enableNotifications() {
    try {
      toast.info("Configurando notificações...");

      const result = await scheduleTaskNotifications(tasks);

      if (result.scheduled === 0) {
        toast.success("Nenhum alerta pendente no momento.");
        return;
      }

      const { late, todayDue, next7 } = result.alerts;
      const parts = [];
      if (late.length)     parts.push(`${late.length} atrasada(s)`);
      if (todayDue.length) parts.push(`${todayDue.length} hoje`);
      if (next7.length)    parts.push(`${next7.length} em 7 dias`);

      toast.success(
        `${result.scheduled} notificação(ões) programada(s)${parts.length ? ` — ${parts.join(", ")}` : ""}.`
      );
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Erro ao configurar notificações.");
    }
  }

  async function importActivitiesFromExcel(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      toast.info("Lendo planilha...");

      const result = await importTasksFromExcelFile(file);

      const importedTasks = result.tasks || [];
      const importedProjects = result.projects || [];

      if (!importedTasks.length && !importedProjects.length) {
        toast.warning("Nenhum projeto ou atividade encontrado na planilha.");
        event.target.value = "";
        return;
      }

      const normalizedProjects = projects.map((project) =>
        String(project.name || "").trim().toLowerCase()
      );

      const newProjects = importedProjects.filter((newProject) => {
        const name = String(newProject.name || "").trim().toLowerCase();
        return name && !normalizedProjects.includes(name);
      });

      let createdTasks = 0;
      let updatedTasks = 0;

      importedTasks.forEach((newTask) => {
        const newTitle = String(newTask.title || "").trim().toLowerCase();
        const newProject = String(newTask.project || "").trim().toLowerCase();

        const exists = tasks.some(
          (task) =>
            String(task.title || "").trim().toLowerCase() === newTitle &&
            String(task.project || "").trim().toLowerCase() === newProject
        );

        if (exists) updatedTasks += 1;
        else createdTasks += 1;
      });

      setImportPreview({
        fileName: file.name,
        importedTasks,
        importedProjects,
        newProjects,
        createdTasks,
        updatedTasks,
        createdProjects: newProjects.length,
      });

      toast.success("Pré-visualização carregada.");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao ler cronograma Excel.");
    }

    event.target.value = "";
  }

  async function confirmImportActivities() {
    if (!importPreview) return;

    setImportingExcel(true);

    try {
      const importedTasks = importPreview.importedTasks || [];
      const newProjects = importPreview.newProjects || [];

      let createdTasks = 0;
      let updatedTasks = 0;
      const affectedTaskIds = new Set();

      let finalTasks = [...tasks];

      importedTasks.forEach((newTask) => {
        const newTitle = String(newTask.title || "").trim().toLowerCase();
        const newProject = String(newTask.project || "").trim().toLowerCase();

        if (!newTitle || !newProject) return;

        const existingIndex = finalTasks.findIndex(
          (task) =>
            String(task.title || "").trim().toLowerCase() === newTitle &&
            String(task.project || "").trim().toLowerCase() === newProject
        );

        if (existingIndex >= 0) {
          const existing = finalTasks[existingIndex];

          finalTasks[existingIndex] = {
            ...existing,
            responsible: newTask.responsible || existing.responsible,
            startDate: newTask.startDate || existing.startDate,
            endDate: newTask.endDate || existing.endDate,
            status:
              existing.status === "Concluído"
                ? existing.status
                : newTask.status || existing.status,
            priority: newTask.priority || existing.priority || "Média",
            progressComment:
              newTask.progressComment || existing.progressComment || "",
            comments:
              (existing.comments || []).length > 0
                ? existing.comments
                : newTask.comments || [],
            checklist:
              (existing.checklist || []).length > 0
                ? existing.checklist
                : newTask.checklist || [],
            evidences: existing.evidences || [],
            source: "Excel",
            updatedAt: new Date().toISOString(),
          };

          affectedTaskIds.add(finalTasks[existingIndex].id);
          updatedTasks += 1;
        } else {
          const newId = newTask.id || Date.now() + createdTasks;
          finalTasks = [
            {
              ...newTask,
              id: newId,
              comments: newTask.comments || [],
              evidences: newTask.evidences || [],
              checklist: newTask.checklist || [],
              source: "Excel",
              createdAt: new Date().toISOString(),
            },
            ...finalTasks,
          ];
          affectedTaskIds.add(newId);
          createdTasks += 1;
        }
      });

      const finalProjects = [...newProjects, ...projects];

      setProjects(finalProjects);
      setTasks(finalTasks);

      const successMsg = `Importação concluída: ${createdTasks} novas, ${updatedTasks} atualizadas, ${newProjects.length} projetos.`;

      if (userId) {
        try {
          const BATCH = 10;

          for (let i = 0; i < newProjects.length; i += BATCH) {
            await Promise.all(newProjects.slice(i, i + BATCH).map((p) => saveProjectCloud(userId, p)));
          }

          const tasksToSync = finalTasks.filter((t) => affectedTaskIds.has(t.id));
          for (let i = 0; i < tasksToSync.length; i += BATCH) {
            await Promise.all(tasksToSync.slice(i, i + BATCH).map((t) => saveTaskCloud(userId, t)));
          }

          toast.success(successMsg);
        } catch (error) {
          console.warn("Falha ao sincronizar importação na nuvem.", error);
          toast.warning(`Importado localmente: ${createdTasks} novas, ${updatedTasks} atualizadas.`);
        }
      } else {
        toast.success(successMsg);
      }

      setImportPreview(null);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao confirmar importação.");
    }

    setImportingExcel(false);
  }

  async function loadMoreTasks() {
    if (!lastTaskDoc || loadingMoreTasks || !userId) return;
    setLoadingMoreTasks(true);
    try {
      const { tasks: moreTasks, lastDoc: newLastDoc, hasMore } = await fetchTasksPage(userId, lastTaskDoc);
      setTasks((prev) => {
        const existingIds = new Set(prev.map((t) => String(t.id)));
        return [...prev, ...moreTasks.filter((t) => !existingIds.has(String(t.id)))];
      });
      setLastTaskDoc(newLastDoc);
      setHasMoreTasks(hasMore);
    } catch {
      toast.error("Erro ao carregar mais atividades.");
    }
    setLoadingMoreTasks(false);
  }

  async function syncAllToFirebase() {
    if (!userId) {
      toast.error("Faça login para sincronizar.");
      return;
    }

    const total = tasks.length + projects.length + problems.length + knowledge.length;
    if (total === 0) {
      toast.info("Nenhum dado local para sincronizar.");
      return;
    }

    toast.info(`Sincronizando ${total} item(s) com a nuvem...`, { duration: 5000 });

    try {
      const BATCH = 10;
      const syncs = [
        ...tasks.map((t) => () => saveTaskCloud(userId, t)),
        ...projects.map((p) => () => saveProjectCloud(userId, p)),
        ...problems.map((p) => () => saveProblemCloud(userId, p)),
        ...knowledge.map((k) => () => saveKnowledgeCloud(userId, k)),
      ];

      for (let i = 0; i < syncs.length; i += BATCH) {
        await Promise.all(syncs.slice(i, i + BATCH).map((fn) => fn()));
      }

      // Mark as synced so the automatic initial sync doesn't run again
      localStorage.setItem(`masterdot_synced_${userId}`, "1");

      toast.success(`${total} item(s) sincronizado(s) com sucesso.`);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao sincronizar. Verifique a conexão.");
    }
  }

  function exportBackup() {
    const data = JSON.stringify(
      {
        tasks,
        problems,
        knowledge,
        projects,
      },
      null,
      2
    );

    const blob = new Blob([data], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `backup-master-dot-${today}.json`;
    a.click();

    URL.revokeObjectURL(url);
  }

  async function importBackup(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const data = JSON.parse(text);

    const importedTasks = data.tasks || [];
    const importedProblems = data.problems || [];
    const importedKnowledge = data.knowledge || [];
    const importedProjects = data.projects || defaultProjects;

    setTasks(importedTasks);
    setProblems(importedProblems);
    setKnowledge(importedKnowledge);
    setProjects(importedProjects);

    if (userId) {
      const BATCH = 10;
      const syncs = [
        ...importedTasks.map((t) => () => saveTaskCloud(userId, t)),
        ...importedProjects.map((p) => () => saveProjectCloud(userId, p)),
        ...importedProblems.map((p) => () => saveProblemCloud(userId, p)),
        ...importedKnowledge.map((k) => () => saveKnowledgeCloud(userId, k)),
      ];
      for (let i = 0; i < syncs.length; i += BATCH) {
        await Promise.all(syncs.slice(i, i + BATCH).map((fn) => fn()));
      }
    }

    event.target.value = "";
    toast.success("Backup restaurado com sucesso.");
  }

  const toggleTaskExpanded = useCallback((taskId) => {
    setExpandedTaskIds((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  }, []);

  async function updateTaskComment(taskId, commentId, text) {
    if (!text.trim()) {
      toast.warning("Digite o texto do comentário.");
      return;
    }

    const current = tasks.find((task) => task.id === taskId);
    if (!current) return;

    const updatedTask = {
      ...current,
      progressComment: text.trim(),
      comments: (current.comments || []).map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              text: text.trim(),
              editedAt: new Date().toLocaleString("pt-BR"),
            }
          : comment
      ),
    };

    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? updatedTask : task))
    );

    if (userId) {
      try {
        await saveTaskCloud(userId, updatedTask);
      } catch (error) {
        console.warn("Comentário editado localmente, mas falhou na nuvem.", error);
      }
    }

    toast.success("Comentário atualizado.");
  }

  async function deleteTaskComment(taskId, commentId) {
    const ok = await confirmFn("Deseja realmente excluir este comentário?", "Excluir comentário?");
    if (!ok) return;

    const current = tasks.find((task) => task.id === taskId);
    if (!current) return;

    const remainingComments = (current.comments || []).filter(
      (comment) => comment.id !== commentId
    );

    const updatedTask = {
      ...current,
      comments: remainingComments,
      progressComment:
        remainingComments.length > 0
          ? remainingComments[remainingComments.length - 1].text
          : "",
    };

    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? updatedTask : task))
    );

    if (userId) {
      try {
        await saveTaskCloud(userId, updatedTask);
      } catch (error) {
        console.warn("Comentário removido localmente, mas falhou na nuvem.", error);
      }
    }

    toast.success("Comentário excluído.");
  }

  async function exportFilteredTasks() {
    if (!filters.filteredMainTasks.length) {
      toast.warning("Não há atividades para exportar.");
      return;
    }

    try {
      await exportTasksToExcel(filters.filteredMainTasks, "masterdot-atividades");
    } catch (err) {
      if (!isShareCancel(err)) toast.error("Erro ao exportar atividades.");
    }
  }

  async function exportExecutiveExcel() {
    if (!tasks.length) {
      toast.warning("Não há atividades para exportar.");
      return;
    }

    try {
      await exportExecutiveReport(tasks, projects);
      toast.success("Relatório executivo exportado.");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao exportar relatório executivo.");
    }
  }

  async function exportExecutivePdf() {
    if (!tasks.length) {
      toast.warning("Não há atividades para exportar.");
      return;
    }

    try {
      toast.info("Gerando relatório PDF...");
      await exportExecutivePdfReport(tasks, projects);
      toast.success("Relatório PDF gerado.");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar relatório PDF.");
    }
  }

  async function shareTaskWhatsApp(task) {
    const subtasks = tasks.filter((t) => t.parentId === task.id);
    const responsibles = Array.isArray(task.responsibles) && task.responsibles.length
      ? task.responsibles.join(", ")
      : task.responsible || "Sem responsável";

    const checklist = (task.checklist || [])
      .map((i) => `${i.done ? "✅" : "⬜"} ${i.text}`)
      .join("\n");

    const lines = [
      `*[MetaPulse] ${task.title}*`,
      "",
      `📁 Projeto: ${task.project || "-"}`,
      `👤 Responsável: ${responsibles}`,
      `🚦 Status: ${task.status}  |  🔴 Prioridade: ${task.priority}`,
      `📅 Início: ${task.startDate || "-"}  →  Prazo: ${task.endDate || "-"}`,
      typeof task.progress === "number" ? `📊 Progresso: ${task.progress}%` : null,
      task.notes ? `\n📝 *Descritivo:*\n${task.notes}` : "",
      task.progressComment ? `\n💬 *Último andamento:*\n${task.progressComment}` : "",
      checklist ? `\n📋 *Checklist:*\n${checklist}` : "",
      subtasks.length ? `\n🔗 Subatividades: ${subtasks.length}` : "",
    ].filter(Boolean).join("\n");

    const photoEvidences = (task.evidences || []).filter((e) => e.dataUrl);

    try {
      if (photoEvidences.length > 0) {
        const fileUris = await Promise.all(
          photoEvidences.map(async (e, i) => {
            const base64 = e.dataUrl.includes(",") ? e.dataUrl.split(",")[1] : e.dataUrl;
            const saved = await Filesystem.writeFile({
              path: `evidencia_${task.id}_${i}.jpg`,
              data: base64,
              directory: Directory.Cache,
            });
            return saved.uri;
          })
        );
        await Share.share({ text: lines, files: fileUris, dialogTitle: "Compartilhar via WhatsApp" });
      } else {
        await Share.share({ text: lines, dialogTitle: "Compartilhar via WhatsApp" });
      }
    } catch (err) {
      if (!isShareCancel(err)) toast.error("Erro ao compartilhar.");
    }
  }

  async function shareTaskPdf(task) {
    const subtasks = tasks.filter((t) => t.parentId === task.id);
    try {
      toast.info("Gerando PDF...");
      await shareTaskAsPdf(task, subtasks);
    } catch (err) {
      if (!isShareCancel(err)) toast.error("Erro ao gerar PDF.");
    }
  }

  async function shareTaskExcel(task) {
    const subtasks = tasks.filter((t) => t.parentId === task.id);
    try {
      toast.info("Gerando Excel...");
      await shareTaskAsExcel(task, subtasks);
    } catch (err) {
      if (!isShareCancel(err)) toast.error("Erro ao gerar Excel.");
    }
  }

  async function moveTaskStatus(taskId, newStatus) {
    const current = tasks.find((task) => task.id === taskId);

    if (!current) return;
    if (current.status === newStatus) return;

    const updatedTask = {
      ...current,
      status: newStatus,
      progressComment: `Status alterado: ${current.status} → ${newStatus}`,
      comments: [
        ...(current.comments || []),
        {
          id: Date.now(),
          date: new Date().toLocaleString("pt-BR"),
          text: `Status alterado: ${current.status} → ${newStatus}`,
        },
      ],
      history: [...(current.history || []), makeHistoryEntry("status", `${current.status} → ${newStatus}`, member?.name || userEmail)],
    };

    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? updatedTask : task))
    );

    if (userId) {
      try {
        await saveTaskCloud(userId, updatedTask);
      } catch (error) {
        console.warn("Status atualizado localmente, mas falhou na nuvem.", error);
      }
    }

    toast.success(`Atividade movida para ${newStatus}.`);
  }

  const taskAlerts = useMemo(() => {
    return getTaskAlerts(tasks);
  }, [tasks]);

  // ── Papéis / permissões ───────────────────────────────────────────────────
  const role = member?.role || null;
  const memberStatus = member?.status || null;
  const isAdmin = role === "admin";
  const isManager = role === "admin" || role === "gestor";

  // Colaborador só pode editar atividades que criou ou em que é responsável.
  function canEditTask(task) {
    if (isManager) return true;
    if (!task) return false;
    if (task.createdBy && userId && task.createdBy === userId) return true;
    const resp = Array.isArray(task.responsibles) ? task.responsibles : [];
    const myName = member?.name || "";
    const myEmail = (userEmail || "").toLowerCase();
    return resp.some(
      (r) => String(r).toLowerCase() === myEmail || (myName && String(r).toLowerCase() === myName.toLowerCase())
    );
  }

  // ── Gestão de contas (admin) ──────────────────────────────────────────────
  async function approveMemberAccount(uid, newRole = "colaborador") {
    try {
      await updateMemberRole(uid, newRole);
      await updateMemberStatus(uid, "active");
      toast.success("Conta aprovada.");
    } catch (e) {
      console.error(e);
      toast.error("Falha ao aprovar conta.");
    }
  }

  async function setMemberRole(uid, newRole) {
    try {
      await updateMemberRole(uid, newRole);
      toast.success("Papel atualizado.");
    } catch (e) {
      console.error(e);
      toast.error("Falha ao atualizar papel.");
    }
  }

  async function removeMemberAccount(uid) {
    if (uid === userId) {
      toast.warning("Você não pode remover a própria conta.");
      return;
    }
    const ok = await confirmFn("A conta perderá o acesso ao workspace.", "Remover membro?");
    if (!ok) return;
    try {
      await removeMember(uid);
      toast.success("Membro removido.");
    } catch (e) {
      console.error(e);
      toast.error("Falha ao remover membro.");
    }
  }

  async function inviteMember(email, inviteRole = "colaborador") {
    const clean = String(email || "").trim().toLowerCase();
    if (!clean || !clean.includes("@")) {
      toast.warning("Informe um e-mail válido.");
      return;
    }
    try {
      await createInvite(clean, inviteRole, userId);
      toast.success(`Convite criado para ${clean}.`);
    } catch (e) {
      console.error(e);
      toast.error("Falha ao criar convite.");
    }
  }

  async function cancelInvite(email) {
    try {
      await deleteInvite(email);
      toast.success("Convite cancelado.");
    } catch (e) {
      console.error(e);
      toast.error("Falha ao cancelar convite.");
    }
  }

  return {
    loaded,
    userId,
    userEmail,
    member,
    role,
    memberStatus,
    isAdmin,
    isManager,
    canEditTask,
    members,
    invites,
    approveMemberAccount,
    setMemberRole,
    removeMemberAccount,
    inviteMember,
    cancelInvite,

    activeTab,
    setActiveTab,

    tasks,
    setTasks,
    mainTasks,
    dashboard,
    taskAlerts,

    problems,
    setProblems,
    knowledge,
    setKnowledge,
    projects,
    setProjects,

    ...filters,

    cloudError,
    setCloudError,

    showAddOptions,
    setShowAddOptions,
    showQuickAdd,
    setShowQuickAdd,
    quickMode,
    setQuickMode,

    editingTask,
    setEditingTask,
    editingProject,
    setEditingProject,
    editingProblem,
    setEditingProblem,
    editingKnowledge,
    setEditingKnowledge,

    saving,
    isOnline,
    hasMoreTasks,
    loadMoreTasks,
    loadingMoreTasks,
    selectedTaskId,
    setSelectedTaskId,

    expandedTaskIds,
    toggleTaskExpanded,

    commentForm,
    setCommentForm,
    checklistForm,
    setChecklistForm,

    authForm,
    setAuthForm,
    taskForm,
    setTaskForm,
    projectForm,
    setProjectForm,
    problemForm,
    setProblemForm,
    knowledgeForm,
    setKnowledgeForm,

    importPreview,
    setImportPreview,
    importingExcel,
    confirmImportActivities,

    getChildren,
    getProgress,

    loginUser,
    registerUser,
    logout,

    addTask,
    updateTaskStatus,
    saveEditedTask,
    deleteTask,
    moveTaskStatus,

    addTaskComment,
    updateTaskComment,
    deleteTaskComment,

    addChecklistItem,
    updateChecklistItem,
    toggleChecklistItem,
    deleteChecklistItem,

    attachEvidence,
    removeEvidence,

    addProject,
    updateProject,
    deleteProject,

    addProblem,
    updateProblem,
    deleteProblem,

    addKnowledge,
    updateKnowledge,
    deleteKnowledge,

    notificationsEnabled: isNotificationsEnabled(),
    dailyBriefingEnabled,
    notifDaysBefore,
    enableNotifications,
    toggleDailyBriefing,
    updateNotifDaysBefore,

    syncAllToFirebase,
    importActivitiesFromExcel,
    exportBackup,
    importBackup,

    exportFilteredTasks,
    exportExecutiveExcel,
    exportExecutivePdf,

    shareTaskWhatsApp,
    shareTaskPdf,
    shareTaskExcel,
  };
}