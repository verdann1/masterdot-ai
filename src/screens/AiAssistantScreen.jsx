import { useState } from "react";
import { Bot, Send } from "lucide-react";

import DarkCard from "../components/common/DarkCard";
import InputDark from "../components/common/InputDark";

import { Button } from "@/components/ui/button";

import {
  askAiChat,
  askAiPrioritize,
} from "../services/aiAgentService";

export default function AiAssistantScreen({
  app,
}) {
  const [question, setQuestion] =
    useState("");

  const [messages, setMessages] =
    useState([
      {
        role: "assistant",
        text:
          "Olá, sou a IA do Master DOT. Posso ajudar com prioridades, atrasos, planejamento e gestão das atividades.",
      },
    ]);

  const [loading, setLoading] =
    useState(false);

  async function sendQuestion() {
    if (!question.trim()) return;

    const userMessage = {
      role: "user",
      text: question,
    };

    setMessages((prev) => [
      ...prev,
      userMessage,
    ]);

    setLoading(true);

    try {
      const response =
        await askAiChat({
          question,
          tasks: app.tasks,
          projects: app.projects,
        });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text:
            response.answer ||
            "Não consegui responder.",
        },
      ]);
    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text:
            "Erro ao consultar IA.",
        },
      ]);
    }

    setQuestion("");
    setLoading(false);
  }

  async function prioritizeNow() {
    setLoading(true);

    try {
      const response =
        await askAiPrioritize({
          tasks: app.tasks,
          projects: app.projects,
        });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text:
            response.answer ||
            "Não consegui priorizar.",
        },
      ]);
    } catch (error) {
      console.error(error);
    }

    setLoading(false);
  }

  return (
    <div className="space-y-4 pb-28">
      <DarkCard>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-cyan-500/20 p-3">
            <Bot className="text-cyan-400" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">
              IA Master DOT
            </h2>

            <p className="text-sm text-slate-400">
              Assistente inteligente
            </p>
          </div>
        </div>
      </DarkCard>

      <div className="space-y-3">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`rounded-2xl p-4 text-sm ${
              message.role === "user"
                ? "ml-8 bg-cyan-500 text-white"
                : "mr-8 bg-slate-900 text-slate-200"
            }`}
          >
            {message.text}
          </div>
        ))}
      </div>

      <DarkCard>
        <div className="space-y-3">
          <Button
            onClick={prioritizeNow}
            className="h-11 w-full rounded-2xl bg-orange-500 text-white"
          >
            Priorizar atividades
          </Button>

          <div className="flex gap-2">
            <InputDark
              value={question}
              onChange={(e) =>
                setQuestion(e.target.value)
              }
              placeholder="Pergunte algo..."
            />

            <Button
              onClick={sendQuestion}
              disabled={loading}
              className="h-12 rounded-2xl bg-cyan-500 text-white"
            >
              <Send size={18} />
            </Button>
          </div>
        </div>
      </DarkCard>
    </div>
  );
}