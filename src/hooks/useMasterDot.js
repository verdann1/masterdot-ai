import { useEffect, useMemo, useState } from "react";

import {
  defaultProjects,
  initialKnowledge,
  initialProblems,
  initialTasks,
} from "../data/initialData";

import { todayISO } from "../utils/dateUtils";

import { loadAppData, saveAppData } from "../services/storageService";
import { captureEvidence } from "../services/evidenceService";
import { getAiPriority } from "../services/aiPriorityService";
import { scheduleTaskNotifications } from "../services/notificationService";
import { importTasksFromExcelFile } from "../services/excelService";

import {
  listenAuth,
  registerWithEmail,
  loginWithEmail,
  logoutUser,
  subscribeTasks,
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
  uploadEvidenceCloud,
  deleteEvidenceCloud,
} from "../services/firebaseService";

export function useMasterDot() {
  const [loaded, setLoaded] = useState(false);
  const [userId, setUserId] = useState(null);

  const [activeTab, setActiveTab] = useState("home");

  const [tasks, setTasks] = useState(initialTasks);
  const [problems, setProblems] = useState(initialProblems);
  const [knowledge, setKnowledge] = useState(initialKnowledge);
  const [projects, setProjects] = useState(defaultProjects);

  const [showAddOptions, setShowAddOptions] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickMode, setQuickMode] = useState("task");

  const [editingTask, setEditingTask] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const [commentForm, setCommentForm] = useState({ taskId: null, text: "" });
  const [checklistForm, setChecklistForm] = useState({ taskId: null, text: "" });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [priorityFilter, setPriorityFilter] = useState("Todas");

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
    responsible: "",
    notes: "",
    progressComment: "",
  });

  const [projectForm, setProjectForm] = useState({
    name: "",
    color: "blue",
  });

  const [problemForm, setProblemForm] = useState({
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

        unsubscribeTasks = subscribeTasks(user.uid, (cloudTasks) => {
          if (cloudTasks.length > 0) {
            setTasks(cloudTasks);
          }
        });

        unsubscribeProjects = subscribeProjects(user.uid, (cloudProjects) => {
          if (cloudProjects.length > 0) {
            setProjects(cloudProjects);
          }
        });

        unsubscribeProblems = subscribeProblems(user.uid, (cloudProblems) => {
          if (cloudProblems.length > 0) {
            setProblems(cloudProblems);
          }
        });

        unsubscribeKnowledge = subscribeKnowledge(user.uid, (cloudKnowledge) => {
          if (cloudKnowledge.length > 0) {
            setKnowledge(cloudKnowledge);
          }
        });

        setLoaded(true);
      });

      return unsubscribeAuth;
    }

    let unsubscribeAuthPromise = init();

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

    saveAppData({
      tasks,
      problems,
      knowledge,
      projects,
    });
  }, [tasks, problems, knowledge, projects, loaded]);

  const today = todayISO();

  const mainTasks = useMemo(() => {
    return tasks.filter((task) => task.parentId === null);
  }, [tasks]);

  const dashboard = useMemo(() => {
    const openTasks = tasks.filter((task) => task.status !== "Concluído");

    const todayTasks = openTasks.filter(
      (task) => task.startDate <= today && task.endDate >= today
    );

    const late = openTasks.filter((task) => task.endDate && task.endDate < today);

    const critical = openTasks.filter((task) => task.priority === "Alta");

    return {
      openTasks,
      todayTasks,
      late,
      critical,
    };
  }, [tasks, today]);

  const filteredMainTasks = useMemo(() => {
    return mainTasks.filter((task) => {
      const text =
        `${task.title} ${task.project} ${task.notes} ${task.responsible} ${task.progressComment}`.toLowerCase();

      return (
        text.includes(search.toLowerCase()) &&
        (statusFilter === "Todos" || task.status === statusFilter) &&
        (priorityFilter === "Todas" || task.priority === priorityFilter)
      );
    });
  }, [mainTasks, search, statusFilter, priorityFilter]);

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
      alert("Informe e-mail e senha.");
      return;
    }

    try {
      await loginWithEmail(authForm.email, authForm.password);
    } catch (error) {
      console.error(error);
      alert("Erro ao entrar. Verifique e-mail e senha.");
    }
  }

  async function registerUser() {
    if (!authForm.email || !authForm.password) {
      alert("Informe e-mail e senha.");
      return;
    }

    try {
      await registerWithEmail(authForm.email, authForm.password);
    } catch (error) {
      console.error(error);
      alert("Erro ao criar conta.");
    }
  }

  async function logout() {
    await logoutUser();
    setUserId(null);
  }

  async function addTask() {
    if (!taskForm.title.trim()) return;

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
      title: taskForm.title,
      project: parentTask ? parentTask.project : taskForm.project,
      priority: taskForm.priority,
      status: taskForm.status,
      startDate: taskForm.startDate,
      endDate: taskForm.endDate,
      responsible: taskForm.responsible,
      type: isSubtask ? "Subatividade" : "Atividade Primária",
      notes: taskForm.notes,
      progressComment: taskForm.progressComment,
      comments: comment,
      evidences: [],
      checklist: [],
    };

    setTasks((prev) => [newTask, ...prev]);

    if (userId) {
      await saveTaskCloud(userId, newTask);
    }

    setTaskForm({
      title: "",
      parentId: "",
      project: "Rotina diária",
      priority: "Média",
      status: "Aberto",
      startDate: "",
      endDate: "",
      responsible: "",
      notes: "",
      progressComment: "",
    });

    setShowQuickAdd(false);
    setShowAddOptions(false);
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
      await saveTaskCloud(userId, updatedTask);
    }
  }

  async function saveEditedTask() {
    if (!editingTask?.title?.trim()) return;

    setTasks((prev) =>
      prev.map((task) => (task.id === editingTask.id ? editingTask : task))
    );

    if (userId) {
      await saveTaskCloud(userId, editingTask);
    }

    setEditingTask(null);
  }

  async function deleteTask(id) {
    const children = tasks.filter((task) => task.parentId === id);

    setTasks((prev) => prev.filter((task) => task.id !== id && task.parentId !== id));

    if (userId) {
      await deleteTaskCloud(userId, id);

      for (const child of children) {
        await deleteTaskCloud(userId, child.id);
      }
    }

    setSelectedTaskId(null);
  }

  async function addTaskComment(taskId, text) {
    if (!text.trim()) return;

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

    setTasks((prev) => prev.map((task) => (task.id === taskId ? updatedTask : task)));

    if (userId) {
      await saveTaskCloud(userId, updatedTask);
    }

    setCommentForm({
      taskId: null,
      text: "",
    });
  }

  async function addChecklistItem(taskId, text) {
    if (!text.trim()) return;

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

    setTasks((prev) => prev.map((task) => (task.id === taskId ? updatedTask : task)));

    if (userId) {
      await saveTaskCloud(userId, updatedTask);
    }

    setChecklistForm({
      taskId: null,
      text: "",
    });
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

    setTasks((prev) => prev.map((task) => (task.id === taskId ? updatedTask : task)));

    if (userId) {
      await saveTaskCloud(userId, updatedTask);
    }
  }

  async function deleteChecklistItem(taskId, itemId) {
    const current = tasks.find((task) => task.id === taskId);
    if (!current) return;

    const updatedTask = {
      ...current,
      checklist: (current.checklist || []).filter((item) => item.id !== itemId),
    };

    setTasks((prev) => prev.map((task) => (task.id === taskId ? updatedTask : task)));

    if (userId) {
      await saveTaskCloud(userId, updatedTask);
    }
  }

  async function attachEvidence(taskId) {
  const current = tasks.find((task) => task.id === taskId);
  if (!current) return;

  const localEvidence = await captureEvidence();

  let finalEvidence = localEvidence;

  if (userId) {
    finalEvidence = await uploadEvidenceCloud(userId, taskId, localEvidence);
    }

  const updatedTask = {
    ...current,
    evidences: [...(current.evidences || []), finalEvidence],
    };

  setTasks((prev) =>
    prev.map((task) => (task.id === taskId ? updatedTask : task))
    );

  if (userId) {
    await saveTaskCloud(userId, updatedTask);
    }
  }

  async function removeEvidence(taskId, evidenceId) {
  const current = tasks.find((task) => task.id === taskId);
  if (!current) return;

  const evidence = (current.evidences || []).find((item) => item.id === evidenceId);

  if (userId && evidence?.path) {
    await deleteEvidenceCloud(evidence.path);
    }

  const updatedTask = {
    ...current,
    evidences: (current.evidences || []).filter((item) => item.id !== evidenceId),
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

  async function deleteProject(id) {
    setProjects((prev) => prev.filter((project) => project.id !== id));

    if (userId) {
      await deleteProjectCloud(userId, id);
    }
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

  async function deleteProblem(id) {
    setProblems((prev) => prev.filter((problem) => problem.id !== id));

    if (userId) {
      await deleteProblemCloud(userId, id);
    }
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

  async function deleteKnowledge(id) {
    setKnowledge((prev) => prev.filter((item) => item.id !== id));

    if (userId) {
      await deleteKnowledgeCloud(userId, id);
    }
  }

  async function applyAiPriority() {
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
      for (const task of updatedTasks) {
        await saveTaskCloud(userId, task);
      }
    }

    alert("Priorização aplicada.");
  }

  async function enableNotifications() {
    await scheduleTaskNotifications(tasks);
  }

  async function importActivitiesFromExcel(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    const imported = await importTasksFromExcelFile(file);

    setTasks((prev) => [...imported, ...prev]);

    if (userId) {
      for (const task of imported) {
        await saveTaskCloud(userId, task);
      }
    }

    alert(`${imported.length} atividades importadas.`);

    event.target.value = "";
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
      for (const task of importedTasks) {
        await saveTaskCloud(userId, task);
      }

      for (const project of importedProjects) {
        await saveProjectCloud(userId, project);
      }

      for (const problem of importedProblems) {
        await saveProblemCloud(userId, problem);
      }

      for (const item of importedKnowledge) {
        await saveKnowledgeCloud(userId, item);
      }
    }

    event.target.value = "";
  }

  return {
    loaded,
    userId,
    activeTab,
    setActiveTab,
    tasks,
    setTasks,
    problems,
    setProblems,
    knowledge,
    setKnowledge,
    projects,
    setProjects,
    showAddOptions,
    setShowAddOptions,
    showQuickAdd,
    setShowQuickAdd,
    quickMode,
    setQuickMode,
    editingTask,
    setEditingTask,
    selectedTaskId,
    setSelectedTaskId,
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
    mainTasks,
    filteredMainTasks,
    dashboard,
    getChildren,
    getProgress,
    loginUser,
    registerUser,
    logout,
    addTask,
    updateTaskStatus,
    saveEditedTask,
    deleteTask,
    addTaskComment,
    addChecklistItem,
    toggleChecklistItem,
    deleteChecklistItem,
    attachEvidence,
    removeEvidence,
    addProject,
    deleteProject,
    addProblem,
    deleteProblem,
    addKnowledge,
    deleteKnowledge,
    applyAiPriority,
    enableNotifications,
    importActivitiesFromExcel,
    exportBackup,
    importBackup,
  };
}