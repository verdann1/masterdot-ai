import { Mic } from "lucide-react";
import { useVoiceInput } from "../../hooks/useVoiceInput";

export default function VoiceMicButton({ onResult, className = "" }) {
  const { supported, listening, start, stop } = useVoiceInput({ onResult });
  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={listening ? stop : start}
      title={listening ? "Parar" : "Ditar (voz para texto)"}
      className={`rounded-xl p-2 transition-colors ${
        listening
          ? "animate-pulse bg-red-500/25 text-red-400"
          : "bg-slate-800 text-slate-400 active:opacity-70"
      } ${className}`}
    >
      <Mic className="h-4 w-4" />
    </button>
  );
}
