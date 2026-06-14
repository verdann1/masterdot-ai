import { useRef, useState } from "react";

const SR = typeof window !== "undefined"
  ? (window.SpeechRecognition || window.webkitSpeechRecognition || null)
  : null;

export function useVoiceInput({ onResult, lang = "pt-BR" } = {}) {
  const recRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState(null);

  function start() {
    if (!SR) return;
    setError(null);
    const rec = new SR();
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = false;

    rec.onresult = (e) => {
      const text = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join(" ")
        .trim();
      if (text) onResult?.(text);
      setListening(false);
    };

    rec.onerror = (e) => {
      setError(e.error);
      setListening(false);
    };

    rec.onend = () => setListening(false);
    rec.start();
    recRef.current = rec;
    setListening(true);
  }

  function stop() {
    recRef.current?.stop();
    setListening(false);
  }

  return { supported: Boolean(SR), listening, error, start, stop };
}
