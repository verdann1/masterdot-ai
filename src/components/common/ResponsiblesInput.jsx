import { useState } from "react";
import { X } from "lucide-react";

export default function ResponsiblesInput({ value = [], onChange, placeholder }) {
  const [input, setInput] = useState("");

  function commit() {
    const name = input.trim();
    if (name && !value.includes(name)) onChange([...value, name]);
    setInput("");
  }

  function handleKey(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    }
    if (e.key === "Backspace" && !input && value.length) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="min-h-[44px] rounded-2xl border border-slate-700 bg-slate-900 p-2">
      {value.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {value.map((name) => (
            <span
              key={name}
              className="flex items-center gap-1 rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs text-cyan-300"
            >
              {name}
              <button
                type="button"
                onClick={() => onChange(value.filter((n) => n !== name))}
              >
                <X className="h-3 w-3 opacity-60 hover:opacity-100" />
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={commit}
        placeholder={
          value.length === 0
            ? (placeholder || "Nome + Enter para adicionar")
            : "Adicionar outro..."
        }
        className="w-full bg-transparent px-1 text-sm text-white placeholder:text-slate-600 focus:outline-none"
      />
    </div>
  );
}
