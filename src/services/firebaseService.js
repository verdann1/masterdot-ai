import { initializeApp } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
} from "firebase/firestore";

import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import {
  getStorage,
  ref,
  uploadString,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export const auth = getAuth(app);
export const storage = getStorage(app);

function cleanData(data) {
  return JSON.parse(JSON.stringify(data));
}

// ── Workspace / contas ────────────────────────────────────────────────────────
// Modelo: workspace único compartilhado. tasks/projects/problems/knowledge ficam
// em coleções de topo (todos os membros ativos veem). tt_* (Ponto) permanece por
// usuário (dado sensível de RH).
export const ADMIN_EMAIL = "verdanmatheus@outlook.com";
export const ROLES = ["admin", "gestor", "colaborador"];

const SHARED = new Set(["tasks", "projects", "problems", "knowledge"]);

function emailKey(email) {
  return String(email || "").trim().toLowerCase();
}

function colRef(userId, name) {
  return SHARED.has(name)
    ? collection(db, name)
    : collection(db, "users", userId, name);
}

function docRef(userId, name, id) {
  return SHARED.has(name)
    ? doc(db, name, String(id))
    : doc(db, "users", userId, name, String(id));
}

// Cria/garante o doc de membership do usuário e retorna { role, status, ... }.
// Bootstrap: ADMIN_EMAIL vira admin ativo; convidado entra com o papel do convite;
// demais entram como colaborador "pending" (aguardando aprovação do admin).
export async function ensureMembership(user) {
  if (!user?.uid) return null;
  const memberRef = doc(db, "members", user.uid);
  const snap = await getDoc(memberRef);
  if (snap.exists()) return snap.data();

  const email = emailKey(user.email);
  let role = "colaborador";
  let status = "pending";

  if (email === emailKey(ADMIN_EMAIL)) {
    role = "admin";
    status = "active";
  } else {
    // Convite pendente?
    try {
      const invSnap = await getDoc(doc(db, "invites", email));
      if (invSnap.exists()) {
        role = invSnap.data().role || "colaborador";
        status = "active";
      }
    } catch {
      /* sem permissão de leitura de convites como não-membro: segue como pending */
    }
  }

  const member = {
    uid: user.uid,
    email: user.email || "",
    name: user.displayName || (user.email ? user.email.split("@")[0] : ""),
    role,
    status,
    createdAt: new Date().toISOString(),
  };
  await setDoc(memberRef, { ...member, updatedAt: serverTimestamp() }, { merge: true });

  // Convite consumido: remove (permitido ao próprio e-mail convidado pelas rules).
  if (status === "active" && role !== "admin" && email !== emailKey(ADMIN_EMAIL)) {
    try { await deleteDoc(doc(db, "invites", email)); } catch { /* ok */ }
  }

  return member;
}

export async function getMembership(uid) {
  if (!uid) return null;
  const snap = await getDoc(doc(db, "members", uid));
  return snap.exists() ? snap.data() : null;
}

export function subscribeMembers(callback, onError) {
  return onSnapshot(
    collection(db, "members"),
    (snap) => callback(snap.docs.map((d) => d.data())),
    (error) => { console.error("Erro ao ouvir members:", error); if (onError) onError(error); callback([]); }
  );
}

export function subscribeInvites(callback, onError) {
  return onSnapshot(
    collection(db, "invites"),
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (error) => { console.error("Erro ao ouvir invites:", error); if (onError) onError(error); callback([]); }
  );
}

export function updateMemberRole(uid, role) {
  return updateDoc(doc(db, "members", uid), { role, updatedAt: serverTimestamp() });
}

export function updateMemberStatus(uid, status) {
  return updateDoc(doc(db, "members", uid), { status, updatedAt: serverTimestamp() });
}

export function removeMember(uid) {
  return deleteDoc(doc(db, "members", uid));
}

export function createInvite(email, role, createdByUid) {
  const key = emailKey(email);
  if (!key) throw new Error("E-mail inválido.");
  return setDoc(doc(db, "invites", key), {
    email: key,
    role: role || "colaborador",
    status: "pending",
    createdBy: createdByUid || null,
    createdAt: new Date().toISOString(),
  });
}

export function deleteInvite(email) {
  return deleteDoc(doc(db, "invites", emailKey(email)));
}

// Migração one-time: copia os dados em nuvem do usuário (users/{uid}/...) para as
// coleções compartilhadas do workspace. Não sobrescreve se a coleção compartilhada
// já tiver dados (evita duplicar). Retorna o total copiado.
export async function migrateUserDataToWorkspace(uid) {
  if (!uid) return 0;
  let copied = 0;
  for (const name of SHARED) {
    const sharedSnap = await getDocs(collection(db, name));
    if (!sharedSnap.empty) continue;
    const srcSnap = await getDocs(collection(db, "users", uid, name));
    for (const d of srcSnap.docs) {
      await setDoc(doc(db, name, d.id), d.data(), { merge: true });
      copied++;
    }
  }
  return copied;
}

export function listenAuth(callback) {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
}

export async function registerWithEmail(email, password) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await ensureMembership(credential.user);
  return credential;
}

export async function loginWithEmail(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential;
}

export function logoutUser() {
  return signOut(auth);
}

function subscribeCollection(userId, collectionName, callback, onError) {
  return onSnapshot(
    colRef(userId, collectionName),
    (snapshot) => {
      callback(snapshot.docs.map((item) => item.data()));
    },
    (error) => {
      console.error(`Erro ao ouvir ${collectionName}:`, error);
      if (onError) onError(error);
      callback([]);
    }
  );
}

function saveCloud(userId, collectionName, item) {
  if (!userId) throw new Error("Usuário não autenticado.");
  if (!item?.id) throw new Error("Item sem ID.");

  return setDoc(
    docRef(userId, collectionName, item.id),
    {
      ...cleanData(item),
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

function deleteCloud(userId, collectionName, itemId) {
  if (!userId) throw new Error("Usuário não autenticado.");

  return deleteDoc(docRef(userId, collectionName, itemId));
}

export const subscribeTasks = (userId, callback) =>
  subscribeCollection(userId, "tasks", callback);

const PAGE_SIZE = 50;

export function subscribeTasksPaged(userId, callback, onError, pageSize = PAGE_SIZE) {
  const q = query(
    colRef(userId, "tasks"),
    orderBy("updatedAt", "desc"),
    limit(pageSize)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const tasks = snapshot.docs.map((d) => d.data());
      const lastDoc = snapshot.docs[snapshot.docs.length - 1] ?? null;
      callback(tasks, lastDoc, snapshot.docs.length >= pageSize);
    },
    (error) => {
      console.error("Erro ao ouvir tasks paginadas:", error);
      if (onError) onError(error);
      callback([], null, false);
    }
  );
}

export async function fetchTasksPage(userId, afterDoc, pageSize = PAGE_SIZE) {
  const q = query(
    colRef(userId, "tasks"),
    orderBy("updatedAt", "desc"),
    startAfter(afterDoc),
    limit(pageSize)
  );
  const snapshot = await getDocs(q);
  const tasks = snapshot.docs.map((d) => d.data());
  const lastDoc = snapshot.docs[snapshot.docs.length - 1] ?? null;
  return { tasks, lastDoc, hasMore: snapshot.docs.length >= pageSize };
}

export const subscribeProjects = (userId, callback, onError) =>
  subscribeCollection(userId, "projects", callback, onError);

export const subscribeProblems = (userId, callback, onError) =>
  subscribeCollection(userId, "problems", callback, onError);

export const subscribeKnowledge = (userId, callback, onError) =>
  subscribeCollection(userId, "knowledge", callback, onError);

export const saveTaskCloud = (userId, task) =>
  saveCloud(userId, "tasks", task);

export const deleteTaskCloud = (userId, taskId) =>
  deleteCloud(userId, "tasks", taskId);

export const saveProjectCloud = (userId, project) =>
  saveCloud(userId, "projects", project);

export const deleteProjectCloud = (userId, projectId) =>
  deleteCloud(userId, "projects", projectId);

export const saveProblemCloud = (userId, problem) =>
  saveCloud(userId, "problems", problem);

export const deleteProblemCloud = (userId, problemId) =>
  deleteCloud(userId, "problems", problemId);

export const saveKnowledgeCloud = (userId, item) =>
  saveCloud(userId, "knowledge", item);

export const deleteKnowledgeCloud = (userId, itemId) =>
  deleteCloud(userId, "knowledge", itemId);

export async function uploadEvidenceCloud(userId, taskId, evidence) {
  const path = `users/${userId}/evidences/${taskId}/${evidence.id}.jpg`;
  const imageRef = ref(storage, path);

  await uploadString(imageRef, evidence.dataUrl, "data_url");

  const url = await getDownloadURL(imageRef);

  return {
    id: evidence.id,
    date: evidence.date,
    type: evidence.type,
    url,
    path,
  };
}

export async function deleteEvidenceCloud(path) {
  if (!path) return;
  await deleteObject(ref(storage, path));
}

// ── Time Tracking ─────────────────────────────────────────────────────────────
export const subscribeEmployees = (userId, callback, onError) =>
  subscribeCollection(userId, "tt_employees", callback, onError);

export const subscribeTimeRecords = (userId, callback, onError) =>
  subscribeCollection(userId, "tt_records", callback, onError);

export const saveEmployeeCloud = (userId, employee) =>
  saveCloud(userId, "tt_employees", employee);

export const deleteEmployeeCloud = (userId, employeeId) =>
  deleteCloud(userId, "tt_employees", employeeId);

export const saveTimeRecordCloud = (userId, record) =>
  saveCloud(userId, "tt_records", record);

export const deleteTimeRecordCloud = (userId, recordId) =>
  deleteCloud(userId, "tt_records", recordId);