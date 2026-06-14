import { useEffect, useState } from "react";
import { X, Database } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import InputDark from "../common/InputDark";
import TextareaDark from "../common/TextareaDark";
import SelectField from "../common/SelectField";

const CATEGORIES = ["Geral", "Projeto", "Processo", "Lição aprendida"];

export default function EditKnowledgeSheet({ app }) {
  const { editingKnowledge, setEditingKnowledge, updateKnowledge } = app;

  const [form, setForm] = useState({ category: "Geral", title: "", content: "" });

  useEffect(() => {
    if (editingKnowledge) {
      setForm({
        category: editingKnowledge.category || "Geral",
        title:    editingKnowledge.title    || "",
        content:  editingKnowledge.content  || "",
      });
    }
  }, [editingKnowledge]);

  if (!editingKnowledge) return null;

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSave() {
    if (!form.title.trim()) return;
    updateKnowledge(editingKnowledge.id, form);
    setEditingKnowledge(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ y: 300, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-[32px] border-t border-slate-800 bg-slate-950 p-4"
      >
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-500/15 p-3">
              <Database className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Editar base de conhecimento</h2>
              <p className="text-xs text-slate-500">Atualize as informações</p>
            </div>
          </div>
          <button
            onClick={() => setEditingKnowledge(null)}
            className="rounded-2xl bg-slate-900 p-2 text-slate-400"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <SelectField
            value={form.category}
            onChange={(v) => set("category", v)}
            options={CATEGORIES}
          />
          <InputDark
            placeholder="Título *"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
          />
          <TextareaDark
            placeholder="Conteúdo"
            value={form.content}
            onChange={(e) => set("content", e.target.value)}
            rows={6}
          />
          <Button
            disabled={!form.title.trim()}
            className="h-12 w-full rounded-2xl bg-slate-100 text-slate-950 disabled:opacity-40"
            onClick={handleSave}
          >
            Atualizar registro
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
