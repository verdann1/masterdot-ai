import { useState } from "react";
import { Clock, LogIn, LogOut, Plus, Pencil, Trash2, User, Users, Calendar, BarChart2, FileText } from "lucide-react";
import { fmtHours, fmtCurrency, dayLabel, getPeriodDates, fmtPeriodLabel } from "../services/timeTrackingCalc";
import { shareTimeTrackingPdf } from "../services/timeTrackingPdfService";
import EmployeeSheet from "../components/timetracking/EmployeeSheet";
import TimeRecordSheet from "../components/timetracking/TimeRecordSheet";
import { toast } from "sonner";

// ── helpers ────────────────────────────────────────────────────────────────

function Tab({ id, label, icon: Icon, active, onClick }) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center gap-1.5 whitespace-nowrap rounded-2xl px-3 py-2 text-xs font-medium transition-colors ${
        active ? "bg-blue-500 text-white" : "bg-slate-800 text-slate-400"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function OvertimeBadge({ minutes, value, ratePercent, isWeekend }) {
  if (minutes <= 0) return (
    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
      Sem HE
    </span>
  );
  return (
    <div className="flex flex-wrap gap-1">
      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        isWeekend ? "bg-red-500/20 text-red-300" : "bg-orange-500/20 text-orange-300"
      }`}>
        {fmtHours(minutes / 60)} HE {ratePercent}%
      </span>
      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-blue-300">
        {fmtCurrency(value)}
      </span>
    </div>
  );
}

// ── Today tab ─────────────────────────────────────────────────────────────

function TodayTab({ tt }) {
  const emp = tt.employees.find((e) => e.id === tt.selectedEmployeeId);
  const todayRec = emp ? tt.getTodayRecord(emp.id) : null;
  const calc = todayRec ? tt.getCalc(todayRec) : null;

  if (tt.employees.length === 0) {
    return (
      <div className="py-12 text-center">
        <Clock className="mx-auto mb-3 h-12 w-12 text-slate-700" />
        <p className="text-sm text-slate-500">Nenhum funcionário cadastrado.</p>
        <button
          onClick={tt.openAddEmployee}
          className="mt-4 rounded-2xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Cadastrar primeiro funcionário
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Employee selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tt.employees.map((e) => (
          <button
            key={e.id}
            onClick={() => tt.setSelectedEmployeeId(e.id)}
            className={`flex shrink-0 items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium transition-colors ${
              tt.selectedEmployeeId === e.id
                ? "bg-blue-500 text-white"
                : "bg-slate-800 text-slate-300"
            }`}
          >
            <User className="h-3.5 w-3.5" />
            {e.name}
          </button>
        ))}
      </div>

      {emp && (
        <>
          {/* Employee schedule info */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">{emp.name}</p>
              <span className="text-[11px] text-slate-500">
                {emp.workStart} – {emp.workEnd} · tol. {emp.toleranceMinutes}min
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              HE: {emp.weekdayOvertime}% dia útil · {emp.saturdayOvertime}% sáb · {emp.sundayOvertime}% dom
              · Base {fmtCurrency(emp.baseSalary || 0)} · Hora {fmtCurrency((emp.baseSalary || 0) / 220)}
            </p>
          </div>

          {/* Today record */}
          {!todayRec ? (
            <div className="rounded-2xl border border-dashed border-slate-700 p-6 text-center">
              <Clock className="mx-auto mb-2 h-8 w-8 text-slate-600" />
              <p className="mb-4 text-sm text-slate-500">Nenhum registro para hoje.</p>
              <button
                onClick={() => tt.openAddRecord(emp.id)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3 text-sm font-bold text-white"
              >
                <LogIn className="h-4 w-4" />
                Registrar entrada
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Entry row */}
              <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-3">
                <div className="rounded-xl bg-emerald-500/15 p-2">
                  <LogIn className="h-4 w-4 text-emerald-300" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">Entrada</p>
                  <p className="text-lg font-bold text-white">{todayRec.entryTime}</p>
                  {todayRec.entryTime < emp.workStart && (
                    <p className="text-[10px] text-orange-400">
                      {(() => {
                        const diff = (emp.workStart.split(":").reduce((h,m,i)=>i===0?h*60+Number(m):h+Number(m),0)) -
                                     (todayRec.entryTime.split(":").reduce((h,m,i)=>i===0?h*60+Number(m):h+Number(m),0));
                        return diff > (emp.toleranceMinutes ?? 5)
                          ? `${diff - (emp.toleranceMinutes ?? 5)}min de HE na entrada`
                          : `${diff}min antecipado (dentro da tolerância)`;
                      })()}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => tt.openEditRecord(todayRec)}
                  className="rounded-xl bg-slate-800 p-2 text-slate-400"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Exit row */}
              {todayRec.exitTime ? (
                <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-3">
                  <div className="rounded-xl bg-red-500/15 p-2">
                    <LogOut className="h-4 w-4 text-red-300" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500">Saída</p>
                    <p className="text-lg font-bold text-white">{todayRec.exitTime}</p>
                    {todayRec.exitTime > emp.workEnd && (
                      <p className="text-[10px] text-orange-400">
                        {(() => {
                          const diff = (todayRec.exitTime.split(":").reduce((h,m,i)=>i===0?h*60+Number(m):h+Number(m),0)) -
                                       (emp.workEnd.split(":").reduce((h,m,i)=>i===0?h*60+Number(m):h+Number(m),0));
                          return diff > (emp.toleranceMinutes ?? 5)
                            ? `${diff - (emp.toleranceMinutes ?? 5)}min de HE na saída`
                            : `${diff}min além (dentro da tolerância)`;
                        })()}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => tt.openEditRecord(todayRec)}
                    className="rounded-xl bg-slate-800 p-2 text-slate-400"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => tt.registerExitNow(emp.id)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-500 py-3 text-sm font-bold text-white"
                >
                  <LogOut className="h-4 w-4" />
                  Registrar saída agora
                </button>
              )}

              {/* Summary if both times recorded */}
              {calc && (
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    Resumo do dia
                  </p>
                  {calc.totalOvertimeMinutes > 0 ? (
                    <>
                      <div className={`rounded-xl p-3 text-center bg-orange-500/10`}>
                        <p className="text-2xl font-bold text-orange-300">
                          {fmtHours(calc.overtimeHours)}
                        </p>
                        <p className="text-[10px] text-slate-500">Hora extra</p>
                      </div>
                      <div className="mt-2 rounded-xl bg-blue-500/10 p-2.5 text-center">
                        <p className="text-base font-bold text-blue-300">{fmtCurrency(calc.overtimeValue)}</p>
                        <p className="text-[10px] text-slate-500">
                          Valor HE ({calc.ratePercent}% — {calc.isWeekend ? "fim de semana" : "dia útil"})
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-xl bg-emerald-500/10 p-3 text-center">
                      <p className="text-base font-bold text-emerald-300">Sem horas extras</p>
                      <p className="text-[10px] text-slate-500">Dentro do horário normal</p>
                    </div>
                  )}
                  {todayRec.note && (
                    <p className="mt-2 text-[11px] text-slate-500">📝 {todayRec.note}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── History tab ────────────────────────────────────────────────────────────

function HistoryTab({ tt }) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const emp = tt.employees.find((e) => e.id === tt.selectedEmployeeId);
  if (!emp) return <p className="py-8 text-center text-sm text-slate-500">Selecione um funcionário.</p>;

  const allRecords = tt.getEmployeeRecords(emp.id);
  const empRecords = allRecords.filter((r) => {
    if (dateFrom && r.date < dateFrom) return false;
    if (dateTo && r.date > dateTo) return false;
    return true;
  });

  return (
    <div className="space-y-3">
      {/* Employee selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tt.employees.map((e) => (
          <button
            key={e.id}
            onClick={() => tt.setSelectedEmployeeId(e.id)}
            className={`shrink-0 rounded-2xl px-3 py-1.5 text-xs font-medium ${
              tt.selectedEmployeeId === e.id ? "bg-blue-500 text-white" : "bg-slate-800 text-slate-400"
            }`}
          >
            {e.name}
          </button>
        ))}
      </div>

      {/* Date filter */}
      <div className="flex gap-2">
        <div className="flex-1">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">De</p>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 w-full rounded-2xl border border-slate-800 bg-slate-900 px-3 text-xs text-slate-300 focus:border-blue-500/50 focus:outline-none"
          />
        </div>
        <div className="flex-1">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Até</p>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9 w-full rounded-2xl border border-slate-800 bg-slate-900 px-3 text-xs text-slate-300 focus:border-blue-500/50 focus:outline-none"
          />
        </div>
        {(dateFrom || dateTo) && (
          <div className="flex items-end pb-0.5">
            <button
              onClick={() => { setDateFrom(""); setDateTo(""); }}
              className="rounded-2xl bg-slate-800 px-3 py-2 text-xs text-slate-400"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {(dateFrom || dateTo) && (
        <p className="text-[11px] text-slate-500">
          {empRecords.length} registro(s) no período
        </p>
      )}

      <button
        onClick={() => tt.openAddRecord(emp.id)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-blue-500/40 py-2.5 text-sm font-medium text-blue-400"
      >
        <Plus className="h-4 w-4" />
        Registrar ponto manualmente
      </button>

      {empRecords.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-500">Nenhum registro encontrado.</p>
      )}

      {empRecords.map((rec) => {
        const calc = tt.getCalc(rec);
        return (
          <div key={rec.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-sm font-semibold text-white capitalize">{dayLabel(rec.date)}</p>
                <p className="mt-1 text-[11px] text-slate-400">
                  <LogIn className="mr-0.5 inline h-3 w-3 text-emerald-400" />
                  {rec.entryTime}
                  {rec.exitTime && (
                    <>
                      <span className="mx-1.5 text-slate-600">→</span>
                      <LogOut className="mr-0.5 inline h-3 w-3 text-red-400" />
                      {rec.exitTime}
                    </>
                  )}
                  {!rec.exitTime && (
                    <span className="ml-2 text-orange-400">aguardando saída</span>
                  )}
                </p>
                {calc && (
                  <div className="mt-1.5">
                    <OvertimeBadge
                      minutes={calc.totalOvertimeMinutes}
                      value={calc.overtimeValue}
                      ratePercent={calc.ratePercent}
                      isWeekend={calc.isWeekend}
                    />
                  </div>
                )}
                {rec.note && (
                  <p className="mt-1 text-[10px] text-slate-600">{rec.note}</p>
                )}
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => tt.openEditRecord(rec)}
                  className="rounded-xl bg-slate-800 p-1.5 text-slate-400"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => tt.deleteRecord(rec.id)}
                  className="rounded-xl bg-red-500/10 p-1.5 text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Employees tab ─────────────────────────────────────────────────────────

function EmployeesTab({ tt }) {
  return (
    <div className="space-y-3">
      <button
        onClick={tt.openAddEmployee}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-blue-500/40 py-3 text-sm font-medium text-blue-400"
      >
        <Plus className="h-4 w-4" />
        Cadastrar funcionário
      </button>

      {tt.employees.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-500">Nenhum funcionário cadastrado.</p>
      )}

      {tt.employees.map((emp) => (
        <div key={emp.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="font-semibold text-white">{emp.name}</p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {emp.workStart} – {emp.workEnd} · tol. {emp.toleranceMinutes}min
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {fmtCurrency(emp.baseSalary || 0)} base · Hora {fmtCurrency((emp.baseSalary || 0) / 220)}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-600">
                HE: {emp.weekdayOvertime}% útil · {emp.saturdayOvertime}% sáb · {emp.sundayOvertime}% dom
              </p>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => tt.openEditEmployee(emp)}
                className="rounded-xl bg-slate-800 p-1.5 text-slate-400"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => tt.deleteEmployee(emp.id)}
                className="rounded-xl bg-red-500/10 p-1.5 text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Summary tab ───────────────────────────────────────────────────────────

function SummaryTab({ tt }) {
  const { startISO, endISO } = getPeriodDates(tt.closingMonth);
  const summaries = tt.getPeriodSummaries();
  const periodLabel = fmtPeriodLabel(startISO, endISO);

  // Navigate one period back / forward
  function shiftPeriod(delta) {
    const [year, month] = tt.closingMonth.split("-").map(Number);
    const newMonth = month + delta;
    const d = new Date(year, newMonth - 1, 1);
    tt.setClosingMonth(d.toISOString().slice(0, 7));
  }

  return (
    <div className="space-y-4">
      {/* Period picker */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => shiftPeriod(-1)}
          className="rounded-2xl bg-slate-800 px-3 py-2.5 text-slate-300 text-sm font-bold"
        >
          ‹
        </button>
        <div className="flex-1 rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Período de fechamento</p>
          <p className="text-sm font-bold text-white">{periodLabel}</p>
        </div>
        <button
          onClick={() => shiftPeriod(1)}
          className="rounded-2xl bg-slate-800 px-3 py-2.5 text-slate-300 text-sm font-bold"
        >
          ›
        </button>
      </div>

      {/* Fine-tune with month input + PDF export */}
      <div className="flex gap-2">
        <input
          type="month"
          value={tt.closingMonth}
          onChange={(e) => tt.setClosingMonth(e.target.value)}
          className="flex-1 rounded-2xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-400"
        />
        <button
          onClick={async () => {
            if (tt.employees.length === 0) { toast.warning("Nenhum funcionário cadastrado."); return; }
            try {
              toast.info("Gerando PDF...");
              await shareTimeTrackingPdf(tt.employees, tt.records, tt.closingMonth);
            } catch (e) {
              console.error(e);
              toast.error("Erro ao gerar PDF.");
            }
          }}
          className="flex items-center gap-2 rounded-2xl bg-red-500/15 px-4 py-2 text-sm font-medium text-red-300"
        >
          <FileText className="h-4 w-4" />
          PDF
        </button>
      </div>

      {summaries.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-500">Nenhum funcionário cadastrado.</p>
      )}

      {summaries.map((s) => (
        <div key={s.employee.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-white">{s.employee.name}</p>
              <p className="text-[11px] text-slate-500">{s.daysWorked} dias trabalhados no período</p>
            </div>
            {s.totalOvertimeMinutes > 0 && (
              <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-[10px] font-semibold text-orange-300">
                HE pendente
              </span>
            )}
          </div>

          <div className="mt-3">
            <div className={`rounded-xl p-3 text-center ${
              s.totalOvertimeMinutes > 0 ? "bg-orange-500/10" : "bg-slate-950"
            }`}>
              <p className={`text-2xl font-bold ${
                s.totalOvertimeMinutes > 0 ? "text-orange-300" : "text-slate-600"
              }`}>
                {s.totalOvertimeMinutes > 0 ? fmtHours(s.totalOvertimeHours) : "—"}
              </p>
              <p className="text-[10px] text-slate-500">Total de horas extras</p>
            </div>
          </div>

          {s.totalOvertimeMinutes > 0 && (
            <div className="mt-2 rounded-xl bg-blue-500/10 p-3 text-center">
              <p className="text-2xl font-bold text-blue-300">{fmtCurrency(s.totalOvertimeValue)}</p>
              <p className="text-[10px] text-slate-500">
                Valor total de HE a pagar no fechamento
              </p>
            </div>
          )}

          {/* Day-by-day breakdown */}
          {s.details.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                Dia a dia ({s.details.length} registros)
              </p>
              {s.details.map(({ record, calc }) => (
                <div key={record.id} className="flex items-center justify-between gap-2 rounded-xl bg-slate-950 px-3 py-2">
                  <div>
                    <p className="text-[11px] font-medium text-white capitalize">{dayLabel(record.date)}</p>
                    <p className="text-[10px] text-slate-500">
                      {record.entryTime} → {record.exitTime || "—"}
                      {calc.isWeekend && (
                        <span className="ml-1 text-red-400">FDS</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    {calc.totalOvertimeMinutes > 0 ? (
                      <>
                        <p className="text-[11px] font-semibold text-orange-300">
                          +{fmtHours(calc.overtimeHours)} HE ({calc.ratePercent}%)
                        </p>
                        <p className="text-[10px] text-blue-400">{fmtCurrency(calc.overtimeValue)}</p>
                      </>
                    ) : (
                      <p className="text-[11px] text-emerald-500">Normal</p>
                    )}
                  </div>
                </div>
              ))}

              {/* Period total footer */}
              <div className="mt-1 flex items-center justify-between rounded-xl border border-blue-500/20 bg-blue-500/5 px-3 py-2">
                <p className="text-[11px] font-semibold text-slate-300">Total do período</p>
                <div className="text-right">
                  <p className="text-[11px] font-bold text-orange-300">
                    {fmtHours(s.totalOvertimeHours)} HE
                  </p>
                  <p className="text-xs font-bold text-blue-300">{fmtCurrency(s.totalOvertimeValue)}</p>
                </div>
              </div>
            </div>
          )}

          {s.details.length === 0 && (
            <p className="mt-3 text-center text-xs text-slate-600">Nenhum registro completo neste período.</p>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────

export default function TimeTrackingScreen({ tt }) {
  const tabs = [
    { id: "hoje",        label: "Hoje",        icon: Clock     },
    { id: "historico",   label: "Histórico",   icon: Calendar  },
    { id: "funcionarios",label: "Equipe",      icon: Users     },
    { id: "resumo",      label: "Resumo",      icon: BarChart2 },
  ];

  return (
    <>
      <div className="space-y-4">
        {/* Inner tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((t) => (
            <Tab
              key={t.id}
              id={t.id}
              label={t.label}
              icon={t.icon}
              active={tt.innerTab === t.id}
              onClick={tt.setInnerTab}
            />
          ))}
        </div>

        {tt.innerTab === "hoje"         && <TodayTab       tt={tt} />}
        {tt.innerTab === "historico"    && <HistoryTab     tt={tt} />}
        {tt.innerTab === "funcionarios" && <EmployeesTab   tt={tt} />}
        {tt.innerTab === "resumo"       && <SummaryTab     tt={tt} />}
      </div>

      {tt.showEmployeeSheet && <EmployeeSheet  tt={tt} />}
      {tt.showRecordSheet   && <TimeRecordSheet tt={tt} />}
    </>
  );
}
