import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import InputDark from "../common/InputDark";
import SelectField from "../common/SelectField";
import TextareaDark from "../common/TextareaDark";

export default function TimeRecordSheet({ tt }) {
  const rec = tt.editingRecord || {};

  const [form, setForm] = useState({
    id:          rec.id          || null,
    employeeId:  rec.employeeId  || "",
    date:        rec.date        || new Date().toISOString().slice(0, 10),
    entryTime:   rec.entryTime   || "",
    exitTime:    rec.exitTime    || "",
    note:        rec.note        || "",
  });

  useEffect(() => {
    if (tt.editingRecord) {
      setForm({
        id:         tt.editingRecord.id         || null,
        employeeId: tt.editingRecord.employeeId || "",
        date:       tt.editingRecord.date       || new Date().toISOString().slice(0, 10),
        entryTime:  tt.editingRecord.entryTime  || "",
        exitTime:   tt.editingRecord.exitTime   || "",
        note:       tt.editingRecord.note       || "",
      });
    }
  }, [tt.editingRecord]);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const valid = form.employeeId && form.date && form.entryTime;

  const empOptions = tt.employees.map((e) => String(e.id));
  const empLabels  = Object.fromEntries(tt.employees.map((e) => [String(e.id), e.name]));

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-[32px] border-t border-slate-800 bg-slate-950 p-4">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            {form.id ? "Editar registro" : "Registrar ponto"}
          </h2>
          <button
            onClick={() => tt.setShowRecordSheet(false)}
            className="rounded-2xl bg-slate-900 p-2 text-slate-400"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Funcionário</p>
            <SelectField
              value={String(form.employeeId)}
              onChange={(v) => set("employeeId", Number(v))}
              options={empOptions}
              labels={empLabels}
            />
          </div>

          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Data</p>
            <InputDark
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Entrada *</p>
              <InputDark
                type="time"
                value={form.entryTime}
                onChange={(e) => set("entryTime", e.target.value)}
              />
            </div>
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Saída</p>
              <InputDark
                type="time"
                value={form.exitTime}
                onChange={(e) => set("exitTime", e.target.value)}
              />
            </div>
          </div>

          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Observação</p>
            <TextareaDark
              placeholder="Ex: Reunião fora da empresa"
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
            />
          </div>

          <Button
            disabled={!valid}
            className="h-12 w-full rounded-2xl bg-cyan-500 text-white disabled:opacity-40"
            onClick={() => tt.saveRecord(form)}
          >
            {form.id ? "Salvar alterações" : "Registrar ponto"}
          </Button>
        </div>
      </div>
    </div>
  );
}
