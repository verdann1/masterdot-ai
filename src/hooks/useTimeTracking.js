import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { loadTimeTracking, saveTimeTracking } from "../services/timeTrackingStorage";
import { calcDayOvertime, calcPeriodSummary, getPeriodDates } from "../services/timeTrackingCalc";
import {
  subscribeEmployees,
  subscribeTimeRecords,
  saveEmployeeCloud,
  deleteEmployeeCloud,
  saveTimeRecordCloud,
  deleteTimeRecordCloud,
} from "../services/firebaseService";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function nowTime() {
  return new Date().toTimeString().slice(0, 5);
}

// The "closing month" is the month that closes on the 15th.
// If today is the 16th or later, the open period closes next month.
function currentClosingMonth() {
  const today = new Date();
  if (today.getDate() >= 16) {
    const next = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return next.toISOString().slice(0, 7);
  }
  return today.toISOString().slice(0, 7);
}

export function useTimeTracking({ confirm, userId } = {}) {
  const confirmFn = confirm || ((msg) => Promise.resolve(window.confirm(msg)));
  const [loaded, setLoaded] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [records, setRecords] = useState([]);
  const initialSyncedRef = useRef(false);

  const [innerTab, setInnerTab] = useState("hoje");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [closingMonth, setClosingMonth] = useState(currentClosingMonth());

  const [showEmployeeSheet, setShowEmployeeSheet] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [showRecordSheet, setShowRecordSheet] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    loadTimeTracking().then((data) => {
      const emps = data.employees || [];
      const recs = data.records   || [];
      setEmployees(emps);
      setRecords(recs);
      if (emps.length > 0) setSelectedEmployeeId(emps[0].id);
      setLoaded(true);
    });
  }, []);

  // ── Persist locally ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!loaded) return;
    saveTimeTracking({ employees, records });
  }, [employees, records, loaded]);

  // ── Firebase sync ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    const unsub1 = subscribeEmployees(userId, (data) => {
      if (data.length > 0) setEmployees(data);
    }, (err) => console.warn("tt_employees:", err));

    const unsub2 = subscribeTimeRecords(userId, (data) => {
      if (data.length > 0) setRecords(data);
    }, (err) => console.warn("tt_records:", err));

    return () => { unsub1(); unsub2(); };
  }, [userId]);

  // One-time push of local data to Firebase on first login
  useEffect(() => {
    if (!userId || !loaded || initialSyncedRef.current) return;
    const key = `tt_synced_${userId}`;
    if (localStorage.getItem(key)) return;
    initialSyncedRef.current = true;
    localStorage.setItem(key, "1");
    employees.forEach((e) => saveEmployeeCloud(userId, e).catch(() => {}));
    records.forEach((r) => saveTimeRecordCloud(userId, r).catch(() => {}));
  }, [userId, loaded]); // eslint-disable-line

  // ── Helpers ───────────────────────────────────────────────────────────────
  function getTodayRecord(employeeId) {
    const today = todayISO();
    return records.find((r) => r.employeeId === employeeId && r.date === today) || null;
  }

  function getCalc(record) {
    const emp = employees.find((e) => e.id === record.employeeId);
    if (!emp || !record.exitTime) return null;
    return calcDayOvertime(emp, record);
  }

  function getPeriodSummaries() {
    const { startISO, endISO } = getPeriodDates(closingMonth);
    return employees.map((emp) => calcPeriodSummary(emp, records, startISO, endISO));
  }

  function getEmployeeRecords(employeeId) {
    return [...records]
      .filter((r) => r.employeeId === employeeId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  // ── Employee CRUD ─────────────────────────────────────────────────────────
  function openAddEmployee() {
    setEditingEmployee(null);
    setShowEmployeeSheet(true);
  }

  function openEditEmployee(emp) {
    setEditingEmployee(emp);
    setShowEmployeeSheet(true);
  }

  function saveEmployee(data) {
    if (editingEmployee) {
      const updated = { ...editingEmployee, ...data };
      setEmployees((prev) => prev.map((e) => (e.id === editingEmployee.id ? updated : e)));
      if (userId) saveEmployeeCloud(userId, updated).catch(() => {});
      toast.success("Funcionário atualizado.");
    } else {
      const newEmp = { ...data, id: Date.now() };
      setEmployees((prev) => [...prev, newEmp]);
      setSelectedEmployeeId(newEmp.id);
      if (userId) saveEmployeeCloud(userId, newEmp).catch(() => {});
      toast.success("Funcionário cadastrado.");
    }
    setShowEmployeeSheet(false);
    setEditingEmployee(null);
  }

  async function deleteEmployee(id) {
    const ok = await confirmFn("Todos os registros de ponto serão excluídos.", "Excluir funcionário?");
    if (!ok) return;
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    setRecords((prev) => prev.filter((r) => r.employeeId !== id));
    if (selectedEmployeeId === id) {
      const remaining = employees.filter((e) => e.id !== id);
      setSelectedEmployeeId(remaining[0]?.id || null);
    }
    if (userId) {
      deleteEmployeeCloud(userId, id).catch(() => {});
      records
        .filter((r) => r.employeeId === id)
        .forEach((r) => deleteTimeRecordCloud(userId, r.id).catch(() => {}));
    }
    toast.success("Funcionário excluído.");
  }

  // ── Record CRUD ───────────────────────────────────────────────────────────
  function openAddRecord(employeeId) {
    const today = todayISO();
    const existing = records.find((r) => r.employeeId === employeeId && r.date === today);
    setEditingRecord(
      existing || {
        employeeId: employeeId || selectedEmployeeId,
        date: today,
        entryTime: nowTime(),
        exitTime: "",
        note: "",
      }
    );
    setShowRecordSheet(true);
  }

  function openEditRecord(record) {
    setEditingRecord({ ...record });
    setShowRecordSheet(true);
  }

  function saveRecord(data) {
    if (data.id) {
      setRecords((prev) => prev.map((r) => (r.id === data.id ? data : r)));
      if (userId) saveTimeRecordCloud(userId, data).catch(() => {});
      toast.success("Registro atualizado.");
    } else {
      const newRec = { ...data, id: Date.now() };
      setRecords((prev) => [newRec, ...prev]);
      if (userId) saveTimeRecordCloud(userId, newRec).catch(() => {});
      toast.success("Ponto registrado.");
    }
    setShowRecordSheet(false);
    setEditingRecord(null);
  }

  async function deleteRecord(id) {
    const ok = await confirmFn("Deseja excluir este registro de ponto?", "Excluir registro?");
    if (!ok) return;
    setRecords((prev) => prev.filter((r) => r.id !== id));
    if (userId) deleteTimeRecordCloud(userId, id).catch(() => {});
    toast.success("Registro excluído.");
  }

  // Quick-register exit for today's record
  function registerExitNow(employeeId) {
    const today = todayISO();
    const existing = records.find((r) => r.employeeId === employeeId && r.date === today);
    if (!existing) {
      toast.warning("Registre a entrada primeiro.");
      return;
    }
    const updated = { ...existing, exitTime: nowTime() };
    setRecords((prev) => prev.map((r) => (r.id === existing.id ? updated : r)));
    if (userId) saveTimeRecordCloud(userId, updated).catch(() => {});
    toast.success("Saída registrada.");
  }

  return {
    loaded,
    employees,
    records,
    innerTab,
    setInnerTab,
    selectedEmployeeId,
    setSelectedEmployeeId,
    closingMonth,
    setClosingMonth,
    showEmployeeSheet,
    setShowEmployeeSheet,
    editingEmployee,
    showRecordSheet,
    setShowRecordSheet,
    editingRecord,
    getTodayRecord,
    getCalc,
    getPeriodSummaries,
    getEmployeeRecords,
    openAddEmployee,
    openEditEmployee,
    saveEmployee,
    deleteEmployee,
    openAddRecord,
    openEditRecord,
    saveRecord,
    deleteRecord,
    registerExitNow,
  };
}
