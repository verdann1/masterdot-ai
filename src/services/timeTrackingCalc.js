function toMin(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function fmtMin(minutes) {
  const h = Math.floor(Math.abs(minutes) / 60);
  const m = Math.abs(minutes) % 60;
  return `${h}h${m > 0 ? ` ${m}min` : ""}`;
}

export function fmtHours(hours) {
  const totalMin = Math.round(hours * 60);
  return fmtMin(totalMin);
}

export function fmtCurrency(value) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function dayLabel(dateISO) {
  const date = new Date(dateISO + "T12:00:00");
  return date.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
}

export function calcDayOvertime(employee, record) {
  if (!record.exitTime || !employee) return null;

  const scheduledStart = toMin(employee.workStart);
  const scheduledEnd   = toMin(employee.workEnd);
  const actualEntry    = toMin(record.entryTime);
  const actualExit     = toMin(record.exitTime);
  const tol            = employee.toleranceMinutes ?? 5;

  // Arrived more than `tol` minutes early → overtime
  const earlyEntry = Math.max(0, scheduledStart - actualEntry - tol);
  // Left more than `tol` minutes late → overtime
  const lateExit   = Math.max(0, actualExit - scheduledEnd - tol);

  const totalOvertimeMinutes = earlyEntry + lateExit;

  const date = new Date(record.date + "T12:00:00");
  const dow  = date.getDay(); // 0 = sun, 6 = sat

  let ratePercent = employee.weekdayOvertime ?? 50;
  if (dow === 0)      ratePercent = employee.sundayOvertime   ?? 100;
  else if (dow === 6) ratePercent = employee.saturdayOvertime ?? 75;

  // Brazil standard: hourly rate = salary / 220 monthly hours
  const hourlyRate    = (employee.baseSalary || 0) / 220;
  const overtimeHours = totalOvertimeMinutes / 60;
  // Overtime payment = hourly rate × overtime hours × (1 + rate%/100)
  // Full rate is paid for those hours (not covered by monthly salary) plus the adicional
  const overtimeValue = hourlyRate * overtimeHours * (1 + ratePercent / 100);

  const workedMinutes = actualExit - actualEntry;

  return {
    earlyEntry,
    lateExit,
    totalOvertimeMinutes,
    overtimeHours,
    overtimeValue,
    ratePercent,
    dayOfWeek: dow,
    workedMinutes: Math.max(0, workedMinutes),
    workedHours:   Math.max(0, workedMinutes / 60),
    isWeekend: dow === 0 || dow === 6,
  };
}

// Returns { startISO, endISO } for a closing month (16th prev → 15th current).
// closingMonth format: "YYYY-MM"
export function getPeriodDates(closingMonth) {
  const [year, month] = closingMonth.split("-").map(Number);
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear  = month === 1 ? year - 1 : year;
  const startISO  = `${prevYear}-${String(prevMonth).padStart(2, "0")}-16`;
  const endISO    = `${year}-${String(month).padStart(2, "0")}-15`;
  return { startISO, endISO };
}

export function fmtPeriodLabel(startISO, endISO) {
  const fmt = (iso, showYear) => {
    const d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit", month: "2-digit", ...(showYear ? { year: "numeric" } : {}),
    });
  };
  return `${fmt(startISO, false)} a ${fmt(endISO, true)}`;
}

export function calcPeriodSummary(employee, records, startISO, endISO) {
  const periodRecords = records
    .filter((r) => r.employeeId === employee.id && r.date >= startISO && r.date <= endISO)
    .sort((a, b) => a.date.localeCompare(b.date));

  let totalOvertimeMinutes = 0;
  let totalOvertimeValue   = 0;
  let totalWorkedMinutes   = 0;
  const details = [];

  for (const record of periodRecords) {
    const calc = calcDayOvertime(employee, record);
    if (calc) {
      totalOvertimeMinutes += calc.totalOvertimeMinutes;
      totalOvertimeValue   += calc.overtimeValue;
      totalWorkedMinutes   += calc.workedMinutes;
      details.push({ record, calc });
    }
  }

  return {
    employee,
    startISO,
    endISO,
    records: periodRecords,
    details,
    totalOvertimeMinutes,
    totalOvertimeHours: totalOvertimeMinutes / 60,
    totalOvertimeValue,
    totalWorkedMinutes,
    totalWorkedHours: totalWorkedMinutes / 60,
    daysWorked: periodRecords.filter((r) => r.exitTime).length,
  };
}
