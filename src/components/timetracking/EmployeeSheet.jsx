import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import InputDark from "../common/InputDark";

const DEFAULT_FORM = {
  name: "",
  baseSalary: "",
  workStart: "07:30",
  workEnd: "17:18",
  toleranceMinutes: 5,
  weekdayOvertime: 50,
  saturdayOvertime: 75,
  sundayOvertime: 100,
};

export default function EmployeeSheet({ tt }) {
  const [form, setForm] = useState(DEFAULT_FORM);

  useEffect(() => {
    if (tt.editingEmployee) {
      setForm({
        name:              tt.editingEmployee.name              ?? "",
        baseSalary:        tt.editingEmployee.baseSalary        ?? "",
        workStart:         tt.editingEmployee.workStart         ?? "07:30",
        workEnd:           tt.editingEmployee.workEnd           ?? "17:18",
        toleranceMinutes:  tt.editingEmployee.toleranceMinutes  ?? 5,
        weekdayOvertime:   tt.editingEmployee.weekdayOvertime   ?? 50,
        saturdayOvertime:  tt.editingEmployee.saturdayOvertime  ?? 75,
        sundayOvertime:    tt.editingEmployee.sundayOvertime    ?? 100,
      });
    } else {
      setForm(DEFAULT_FORM);
    }
  }, [tt.editingEmployee]);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSave() {
    if (!form.name.trim()) return;
    tt.saveEmployee({
      ...form,
      baseSalary:       Number(form.baseSalary)       || 0,
      toleranceMinutes: Number(form.toleranceMinutes) || 5,
      weekdayOvertime:  Number(form.weekdayOvertime)  || 50,
      saturdayOvertime: Number(form.saturdayOvertime) || 75,
      sundayOvertime:   Number(form.sundayOvertime)   || 100,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-[32px] border-t border-slate-800 bg-slate-950 p-4">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            {tt.editingEmployee ? "Editar funcionário" : "Novo funcionário"}
          </h2>
          <button
            onClick={() => tt.setShowEmployeeSheet(false)}
            className="rounded-2xl bg-slate-900 p-2 text-slate-400"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Nome *</p>
            <InputDark
              placeholder="Ex: Matheus"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>

          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Salário base (R$)</p>
            <InputDark
              type="number"
              placeholder="Ex: 3000"
              value={form.baseSalary}
              onChange={(e) => set("baseSalary", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Entrada</p>
              <InputDark
                type="time"
                value={form.workStart}
                onChange={(e) => set("workStart", e.target.value)}
              />
            </div>
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Saída</p>
              <InputDark
                type="time"
                value={form.workEnd}
                onChange={(e) => set("workEnd", e.target.value)}
              />
            </div>
          </div>

          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Tolerância (minutos)
            </p>
            <InputDark
              type="number"
              placeholder="5"
              value={form.toleranceMinutes}
              onChange={(e) => set("toleranceMinutes", e.target.value)}
            />
            <p className="mt-1 text-[10px] text-slate-600">
              Entradas/saídas dentro deste limite não geram hora extra.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              % Hora extra
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="mb-1 text-[10px] text-slate-500">Dia útil</p>
                <InputDark
                  type="number"
                  placeholder="50"
                  value={form.weekdayOvertime}
                  onChange={(e) => set("weekdayOvertime", e.target.value)}
                />
              </div>
              <div>
                <p className="mb-1 text-[10px] text-slate-500">Sábado</p>
                <InputDark
                  type="number"
                  placeholder="75"
                  value={form.saturdayOvertime}
                  onChange={(e) => set("saturdayOvertime", e.target.value)}
                />
              </div>
              <div>
                <p className="mb-1 text-[10px] text-slate-500">Dom/Fer.</p>
                <InputDark
                  type="number"
                  placeholder="100"
                  value={form.sundayOvertime}
                  onChange={(e) => set("sundayOvertime", e.target.value)}
                />
              </div>
            </div>
          </div>

          <Button
            disabled={!form.name.trim()}
            className="h-12 w-full rounded-2xl bg-blue-500 text-white disabled:opacity-40"
            onClick={handleSave}
          >
            {tt.editingEmployee ? "Salvar alterações" : "Cadastrar funcionário"}
          </Button>
        </div>
      </div>
    </div>
  );
}
