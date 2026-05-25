import { useState } from "react";
import { Button } from "@/components/ui/button";
import InputDark from "../components/common/InputDark";
import DarkCard from "../components/common/DarkCard";

export default function LoginScreen({ app }) {
  const [mode, setMode] = useState("login");

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-slate-100">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Master DOT</h1>
          <p className="text-sm text-slate-400">Gestão inteligente de atividades</p>
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