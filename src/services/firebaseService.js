import { initializeApp } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  doc,
  setDoc,
  deleteDoc,
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

async function ensureUserDoc(user) {
  if (!user?.uid) return;

  await setDoc(
    doc(db, "users", user.uid),
    {
      uid: user.uid,
      email: user.email || "",
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export function listenAuth(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      await ensureUserDoc(user);
    }

    callback(user);
  });
}

export async function registerWithEmail(email, password) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await ensureUserDoc(credential.user);
  return credential;
}

export async function loginWithEmail(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserDoc(credential.user);
  return credential;
}

export function logoutUser() {
  return signOut(auth);
}

function subscribeCollection(userId, collectionName, callback, onError) {
  return onSnapshot(
    collection(db, "users", userId, collectionName),
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
    doc(db, "users", userId, collectionName, String(item.id)),
    {
      ...cleanData(item),
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

function deleteCloud(userId, collectionName, itemId) {
  if (!userId) throw new Error("Usuário não autenticado.");

  return deleteDoc(doc(db, "users", userId, collectionName, String(itemId)));
}

export const subscribeTasks = (userId, callback) =>
  subscribeCollection(userId, "tasks", callback);

const PAGE_SIZE = 50;

export function subscribeTasksPaged(userId, callback, onError, pageSize = PAGE_SIZE) {
  const q = query(
    collection(db, "users", userId, "tasks"),
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
    collection(db, "users", userId, "tasks"),
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