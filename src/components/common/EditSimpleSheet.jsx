import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function EditSimpleSheet({
  title,
  item,
  onClose,
  onSave,
}) {
  const [value, setValue] = useState("");

  useEffect(() => {
    setValue(item?.name || item?.title || item?.problem || "");
  }, [item]);

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70">
      <div className="w-full rounded-t-[32px] bg-slate-950 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            {title}
          </h2>

          <button
            onClick={onClose}
            className="rounded-xl bg-slate-900 p-2"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="rounded-2xl border-slate-700 bg-slate-900 text-white"
        />

        <Button
          className="mt-4 h-11 w-full rounded-2xl"
          onClick={() => {
            onSave(value);
            onClose();
          }}
        >
          Salvar
        </Button>
      </div>
    </div>
  );
}