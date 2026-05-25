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
  deleteObject 
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
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export const auth = getAuth(app);
export const storage = getStorage(app);

export function listenAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

export function registerWithEmail(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export function loginWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function logoutUser() {
  return signOut(auth);
}

function subscribeCollection(userId, collectionName, callback) {
  return onSnapshot(collection(db, "users", userId, collectionName), (snapshot) => {
    callback(snapshot.docs.map((item) => item.data()));
  });
}

function saveCloud(userId, collectionName, item) {
  return setDoc(doc(db, "users", userId, collectionName, String(item.id)), item);
}

function deleteCloud(userId, collectionName, itemId) {
  return deleteDoc(doc(db, "users", userId, collectionName, String(itemId)));
}

export const subscribeTasks = (userId, callback) => subscribeCollection(userId, "tasks", callback);
export const subscribeProjects = (userId, callback) => subscribeCollection(userId, "projects", callback);
export const subscribeProblems = (userId, callback) => subscribeCollection(userId, "problems", callback);
export const subscribeKnowledge = (userId, callback) => subscribeCollection(userId, "knowledge", callback);

export const saveTaskCloud = (userId, task) => saveCloud(userId, "tasks", task);
export const deleteTaskCloud = (userId, taskId) => deleteCloud(userId, "tasks", taskId);

export const saveProjectCloud = (userId, project) => saveCloud(userId, "projects", project);
export const deleteProjectCloud = (userId, projectId) => deleteCloud(userId, "projects", projectId);

export const saveProblemCloud = (userId, problem) => saveCloud(userId, "problems", problem);
export const deleteProblemCloud = (userId, problemId) => deleteCloud(userId, "problems", problemId);

export const saveKnowledgeCloud = (userId, item) => saveCloud(userId, "knowledge", item);
export const deleteKnowledgeCloud = (userId, itemId) => deleteCloud(userId, "knowledge", itemId);

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