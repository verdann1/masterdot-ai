import { useEffect, useMemo, useState } from "react";

import {
  defaultProjects,
  initialKnowledge,
  initialProblems,
  initialTasks,
} from "../data/initialData";

import { todayISO } from "../utils/dateUtils";
import { loadAppData, saveAppData, loadProductionData, saveProductionData } from "../services/storageService";
import { captureEvidence } from "../services/evidenceService";
import { getAiPriority } from "../services/aiPriorityService";
import {
  scheduleTaskNotifications,
  getTaskAlerts,
} from "../services/notificationService";
import { importTasksFromExcelFile } from "../services/excelService";
import { exportExecutivePdfReport, shareTaskAsPdf } from "../services/pdfReportService";
import { importProductionFromExcel } from "../services/productionImportService";
import { Share } from "@capacitor/share";
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
} from "../services/firebaseService";

import {
  exportTasksToExcel,
  exportExecutiveReport,
  shareTaskAsExcel,
} from "../services/exportService";

export function useMasterDot() {
  const [loaded, setLoaded] = useState(false);
  const [userId, setUserId] = useState(null);

  const [activeTab, setActiveTab] = useState("home");

  const [tasks, setTasks] = useState(initialTasks);
  const [problems, setProblems] = useState(initialProblems);
  const [knowledge, setKnowledge] = useState(initialKnowledge);
  const [projects, setProjects] = useState(defaultProjects);

  const [productionRecords, setProductionRecords] = useState([]);
  const [productionTarget, setProductionTarget] = useState(
    Number(localStorage.getItem("productionTarget") || 5000)
  );

  const [showAddOptions, setShowAddOptions] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickMode, setQuickMode] = useState("task");

  const [editingTask, setEditingTask] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [editingProblem, setEditingProblem] = useState(null);
  const [editingKnowledge, setEditingKnowledge] = useState(null);

  const [saving, setSaving] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastTaskDoc, setLastTaskDoc] = useState(null);
  const [hasMoreTasks, setHasMoreTasks] = useState(false);
  const [loadingMoreTasks, setLoadingMoreTasks] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [expandedTaskIds, setExpandedTaskIds] = useState([]);

  const [commentForm, setCommentForm] = useState({ taskId: null, text: "" });
  const [checklistForm, setChecklistForm] = useState({ taskId: null, text: "" });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [priorityFilter, setPriorityFilter] = useState("Todas");
  const [quickFilter, setQuickFilter] = useState("Todas");

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

  useEffect(() => {
    const up = () => setIsOnline(true);
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

    async function init() {
      const saved = await loadAppData();

      if (saved) {
        setTasks(saved.tasks || []);
        setProblems(saved.problems || []);
        setKnowledge(saved.knowledge || []);
        setProjects(saved.projects || defaultProjects);
      }

      const savedProduction = await loadProductionData();
      if (savedProduction.length > 0) setProductionRecords(savedProduction);

      const unsubscribeAuth = listenAuth((user) => {
        if (unsubscribeTasks) unsubscribeTasks();
        if (unsubscribeProjects) unsubscribeProjects();
        if (unsubscribeProblems) unsubscribeProblems();
        if (unsubscribeKnowledge) unsubscribeKnowledge();

        if (!user) {
          setUserId(null);
          setLoaded(true);
          return;
        }

        setUserId(user.uid);

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
            setTasks((prev) => {
              const freshIds = new Set(cloudTasks.map((t) => String(t.id)));
              const olderTasks = prev.filter((t) => !freshIds.has(String(t.id)));
              return [...cloudTasks, ...olderTasks];
            });
          }
          setLastTaskDoc(lastDoc);
          setHasMoreTasks(hasMore);
        });

        unsubscribeProjects = subscribeProjects(user.uid, (cloudProjects) => {
          if (cloudProjects.length > 0) setProjects(cloudProjects);
        });

        unsubscribeProblems = subscribeProblems(user.uid, (cloudProblems) => {
          if (cloudProblems.length > 0) setProblems(cloudProblems);
        });

        unsubscribeKnowledge = subscribeKnowledge(user.uid, (cloudKnowledge) => {
          if (cloudKnowledge.length > 0) setKnowledge(cloudKnowledge);
        });

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
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    saveAppData({ tasks, problems, knowledge, projects });
  }, [tasks, problems, knowledge, projects, loaded]);

  useEffect(() => {
    if (!loaded) return;
    saveProductionData(productionRecords);
  }, [productionRecords, loaded]);

  useEffect(() => {
    localStorage.setItem("productionTarget", String(productionTarget));
  }, [productionTarget]);

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

  const filteredMainTasks = useMemo(() => {
    let filtered = mainTasks.filter((task) => {
      const commentsText = (task.comments || [])
        .map((comment) => comment.text)
        .join(" ");

      const checklistText = (task.checklist || [])
        .map((item) => item.text)
        .join(" ");

      const linkedProblemsText = problems
        .filter((problem) => String(problem.taskId) === String(task.id))
        .map(
          (problem) =>
            `${problem.problem} ${problem.cause} ${problem.action} ${problem.responsible}`
        )
        .join(" ");

      const text = `
        ${task.title}
        ${task.project}
        ${task.notes}
        ${task.responsible}
        ${task.progressComment}
        ${commentsText}
        ${checklistText}
        ${linkedProblemsText}
      `.toLowerCase();

      return (
        text.includes(search.toLowerCase()) &&
        (statusFilter === "Todos" || task.status === statusFilter) &&
        (priorityFilter === "Todas" || task.priority === priorityFilter)
      );
    });

    if (quickFilter === "Abertas") {
      filtered = filtered.filter((task) => task.status !== "Concluído");
    }

    if (quickFilter === "Concluídas") {
      filtered = filtered.filter((task) => task.status === "Concluído");
    }

    if (quickFilter === "Atrasadas") {
      filtered = filtered.filter(
        (task) =>
          task.status !== "Concluído" && task.endDate && task.endDate < today
      );
    }

    if (quickFilter === "Hoje") {
      filtered = filtered.filter(
        (task) => task.status !== "Concluído" && task.endDate === today
      );
    }

    if (quickFilter === "7 dias") {
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() + 7);

      const limit = limitDate.toISOString().slice(0, 10);

      filtered = filtered.filter(
        (task) =>
          task.status !== "Concluído" &&
          task.endDate &&
          task.endDate >= today &&
          task.endDate <= limit
      );
    }

    return filtered.sort((a, b) => {
      const aDone = a.status === "Concluído";
      const bDone = b.status === "Concluído";

      if (aDone && !bDone) return 1;
      if (!aDone && bDone) return -1;

      const aDate = a.endDate || "9999-12-31";
      const bDate = b.endDate || "9999-12-31";

      return aDate.localeCompare(bDate);
    });
  }, [
    mainTasks,
    problems,
    search,
    statusFilter,
    priorityFilter,
    quickFilter,
    today,
  ]);

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
      };

      setTasks((prev) => [newTask, ...prev]);

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

    setTasks((prev) =>
      prev.map((task) => (task.id === editingTask.id ? editingTask : task))
    );

    if (userId) {
      try {
        await saveTaskCloud(userId, editingTask);
      } catch (error) {
        console.warn("Atividade editada localmente, mas falhou na nuvem.", error);
      }
    }

    setEditingTask(null);
    toast.success("Atividade atualizada.");
  }

  async function deleteTask(id) {
    const confirmDelete = window.confirm(
      "Deseja realmente excluir esta atividade? As subatividades também serão excluídas."
    );

    if (!confirmDelete) return;

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

      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? updatedTask : task))
      );

      await saveAppData({
        tasks: tasks.map((task) => (task.id === taskId ? updatedTask : task)),
        problems,
        knowledge,
        projects,
        productionRecords,
      });

      if (userId) {
        try {
          await saveTaskCloud(userId, updatedTask);
        } catch (error) {
          console.warn("Falha ao sincronizar atividade na nuvem.", error);
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
      await saveTaskCloud(userId, updatedTask);
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

    const confirmDelete = window.confirm("Deseja realmente excluir este projeto?");

    if (!confirmDelete) return;

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
    setProblems((prev) =>
      prev.map((problem) =>
        problem.id === problemId
          ? {
              ...problem,
              ...updates,
            }
          : problem
      )
    );

    toast.success("Problema atualizado.");
  }

  async function deleteProblem(id) {
    const confirmDelete = window.confirm("Deseja realmente excluir este problema?");

    if (!confirmDelete) return;

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

  function updateKnowledge(knowledgeId, updates) {
    setKnowledge((prev) =>
      prev.map((item) =>
        item.id === knowledgeId
          ? {
              ...item,
              ...updates,
            }
          : item
      )
    );

    toast.success("Registro atualizado.");
  }

  async function deleteKnowledge(id) {
    const confirmDelete = window.confirm(
      "Deseja realmente excluir este item da base?"
    );

    if (!confirmDelete) return;

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

  async function applyAiPriority() {
    try {
      toast.info("IA analisando prioridades...");

      const updatedTasks = tasks.map((task) => {
        const rec = getAiPriority(task);

        return {
          ...task,
          priority: rec.priority,
          aiReason: rec.reason,
        };
      });

      setTasks(updatedTasks);

      if (userId) {
        try {
          for (const task of updatedTasks) {
            await saveTaskCloud(userId, task);
          }
        } catch (error) {
          console.warn("Priorização salva localmente, mas falhou na nuvem.", error);
          toast.warning(
            "Prioridades aplicadas localmente. Falha ao sincronizar nuvem."
          );
        }
      }

      toast.success("Priorização da IA aplicada.");
      setActiveTab("home");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao aplicar priorização da IA.");
    }
  }

  async function enableNotifications() {
    try {
      toast.info("Configurando notificações...");

      const result = await scheduleTaskNotifications(tasks);

      if (result.scheduled === 0) {
        toast.success("Nenhum alerta pendente no momento.");
        return;
      }

      toast.success(`${result.scheduled} notificação(ões) programada(s).`);
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

  async function importProductionExcel(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      toast.info("Importando produção...");

      const imported = await importProductionFromExcel(file);

      const existingKeys = new Set(
        productionRecords.map(
          (item) =>
            `${item.date}|${item.time}|${item.equipment}|${item.partNumber}|${item.serial}`
        )
      );

      const newRecords = imported.filter((item) => {
        const key = `${item.date}|${item.time}|${item.equipment}|${item.partNumber}|${item.serial}`;

        if (existingKeys.has(key)) return false;

        existingKeys.add(key);
        return true;
      });

      if (newRecords.length === 0) {
        toast.warning("Nenhum registro novo encontrado. Dados já importados.");
        event.target.value = "";
        return;
      }

      setProductionRecords((prev) => [...newRecords, ...prev]);

      toast.success(
        `${newRecords.length} registro(s) novo(s) importado(s). ${
          imported.length - newRecords.length
        } duplicado(s) ignorado(s).`
      );
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Erro ao importar produção.");
    }

    event.target.value = "";
  }

  function clearProductionRecords() {
    const confirmClear = window.confirm(
      "Deseja realmente limpar todos os dados de produção importados?"
    );

    if (!confirmClear) return;

    setProductionRecords([]);
    toast.success("Dados de produção limpos.");
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

  function exportBackup() {
    const data = JSON.stringify(
      {
        tasks,
        problems,
        knowledge,
        projects,
        // productionRecords excluded — stored and managed separately
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
    // productionRecords are managed separately — not restored from backup

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

  function toggleTaskExpanded(taskId) {
    setExpandedTaskIds((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  }

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
    const confirmDelete = window.confirm(
      "Deseja realmente excluir este comentário?"
    );

    if (!confirmDelete) return;

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

  function exportFilteredTasks() {
    if (!filteredMainTasks.length) {
      toast.warning("Não há atividades para exportar.");
      return;
    }

    exportTasksToExcel(filteredMainTasks, "masterdot-atividades");
    toast.success(`${filteredMainTasks.length} atividade(s) exportada(s).`);
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
      `*[Master DOT] ${task.title}*`,
      "",
      `📁 Projeto: ${task.project || "-"}`,
      `👤 Responsável: ${responsibles}`,
      `🚦 Status: ${task.status}  |  🔴 Prioridade: ${task.priority}`,
      `📅 Início: ${task.startDate || "-"}  →  Prazo: ${task.endDate || "-"}`,
      `📊 Progresso: ${task.progress ?? 0}%`,
      task.notes ? `\n📝 *Descritivo:*\n${task.notes}` : "",
      task.progressComment ? `\n💬 *Último andamento:*\n${task.progressComment}` : "",
      checklist ? `\n📋 *Checklist:*\n${checklist}` : "",
      subtasks.length ? `\n🔗 Subatividades: ${subtasks.length}` : "",
    ].filter(Boolean).join("\n");

    try {
      await Share.share({ text: lines, dialogTitle: "Compartilhar via WhatsApp" });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao compartilhar.");
    }
  }

  async function shareTaskPdf(task) {
    const subtasks = tasks.filter((t) => t.parentId === task.id);
    try {
      toast.info("Gerando PDF...");
      await shareTaskAsPdf(task, subtasks);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar PDF.");
    }
  }

  async function shareTaskExcel(task) {
    const subtasks = tasks.filter((t) => t.parentId === task.id);
    try {
      toast.info("Gerando Excel...");
      await shareTaskAsExcel(task, subtasks);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar Excel.");
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

  return {
    loaded,
    userId,

    activeTab,
    setActiveTab,

    tasks,
    setTasks,
    mainTasks,
    filteredMainTasks,
    dashboard,
    taskAlerts,

    problems,
    setProblems,
    knowledge,
    setKnowledge,
    projects,
    setProjects,

    productionRecords,
    setProductionRecords,
    productionTarget,
    setProductionTarget,
    importProductionExcel,
    clearProductionRecords,

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

    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    quickFilter,
    setQuickFilter,

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

    applyAiPriority,
    enableNotifications,

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