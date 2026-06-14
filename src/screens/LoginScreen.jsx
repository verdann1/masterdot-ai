import { useState } from "react";
import { Button } from "@/components/ui/button";
import InputDark from "../components/common/InputDark";
import DarkCard from "../components/common/DarkCard";
import MetaPulseLogo from "../components/common/MetaPulseLogo";

export default function LoginScreen({ app }) {
  const [mode, setMode] = useState("login");

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-slate-100">
      <div className="w-full max-w-md space-y-4">
        <div className="flex flex-col items-center gap-3">
          <MetaPulseLogo iconSize={80} layout="icon" />
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="text-white">Meta</span><span className="text-cyan-400">Pulse</span>
            </h1>
            <p className="mt-1 text-sm text-slate-400">Gestão inteligente de atividades</p>
          </div>
        </div>

        <DarkCard>
          <div className="space-y-3">
            <InputDark
              type="email"
              placeholder="E-mail"
              value={app.authForm.email}
              onChange={(e) => app.setAuthForm({ ...app.authForm, email: e.target.value })}
            />

            <InputDark
              type="password"
              placeholder="Senha"
              value={app.authForm.password}
              onChange={(e) => app.setAuthForm({ ...app.authForm, password: e.target.value })}
            />

            <Button
              onClick={mode === "login" ? app.loginUser : app.registerUser}
              className="h-12 w-full rounded-2xl bg-slate-100 text-slate-950 hover:bg-white"
            >
              {mode === "login" ? "Entrar" : "Criar conta"}
            </Button>

            <button
              className="w-full text-sm text-slate-400"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
            >
              {mode === "login" ? "Criar nova conta" : "Já tenho conta"}
            </button>
          </div>
        </DarkCard>
      </div>
    </div>
  );
}