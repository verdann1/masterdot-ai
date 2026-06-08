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
  apiKey: "AIzaSyBe9nydVK38hkkToKW3cekQElAARUyy6Ds",
  authDomain: "masterdot-2a46f.firebaseapp.com",
  projectId: "masterdot-2a46f",
  storageBucket: "masterdot-2a46f.firebasestorage.app",
  messagingSenderId: "771658123836",
  appId: "1:771658123836:web:154968be1c78a1ae671139",
  measurementId: "G-EH3THN4PQ0",
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

function subscribeCollection(userId, collectionName, callback) {
  return onSnapshot(
    collection(db, "users", userId, collectionName),
    (snapshot) => {
      callback(snapshot.docs.map((item) => item.data()));
    },
    (error) => {
      console.error(`Erro ao ouvir ${collectionName}:`, error);
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

export function subscribeTasksPaged(userId, callback, pageSize = PAGE_SIZE) {
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

export const subscribeProjects = (userId, callback) =>
  subscribeCollection(userId, "projects", callback);

export const subscribeProblems = (userId, callback) =>
  subscribeCollection(userId, "problems", callback);

export const subscribeKnowledge = (userId, callback) =>
  subscribeCollection(userId, "knowledge", callback);

export const subscribeProductionRecords = (userId, callback) =>
  subscribeCollection(userId, "productionRecords", callback);

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

export const saveProductionRecordCloud = (userId, record) =>
  saveCloud(userId, "productionRecords", record);

export const deleteProductionRecordCloud = (userId, recordId) =>
  deleteCloud(userId, "productionRecords", recordId);

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