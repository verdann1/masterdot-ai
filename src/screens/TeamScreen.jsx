import { useState } from "react";
import { UserPlus, ShieldCheck, Trash2, Check, Mail, X, Crown, Briefcase, User } from "lucide-react";
import DarkCard from "../components/common/DarkCard";
import { Button } from "@/components/ui/button";

const ROLE_OPTS = [
  { value: "admin",       label: "Admin",       icon: Crown,     tone: "text-amber-300" },
  { value: "gestor",      label: "Gestor",      icon: Briefcase, tone: "text-blue-300"  },
  { value: "colaborador", label: "Colaborador", icon: User,      tone: "text-slate-300" },
];

function roleMeta(role) {
  return ROLE_OPTS.find((r) => r.value === role) || ROLE_OPTS[2];
}

function RoleSelect({ value, onChange, disabled }) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-slate-200 focus:border-blue-500/60 focus:outline-none disabled:opacity-50"
    >
      {ROLE_OPTS.map((r) => (
        <option key={r.value} value={r.value}>{r.label}</option>
      ))}
    </select>
  );
}

export default function TeamScreen({ app }) {
  const { members, invites, isAdmin, userId } = app;
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("colaborador");

  const pending = members.filter((m) => m.status !== "active");
  const active = members.filter((m) => m.status === "active");

  function submitInvite() {
    app.inviteMember(inviteEmail, inviteRole);
    setInviteEmail("");
    setInviteRole("colaborador");
  }

  return (
    <div className="space-y-4">
      {!isAdmin && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-xs text-slate-400">
          Você está visualizando a equipe. Apenas administradores podem aprovar, convidar ou alterar papéis.
        </div>
      )}

      {/* Convidar */}
      {isAdmin && (
        <DarkCard>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-blue-400" />
            <h2 className="text-lg font-bold text-white">Convidar por e-mail</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Ao se cadastrar com este e-mail, a pessoa entra direto com o papel definido.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@empresa.com"
              className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-blue-500/60 focus:outline-none"
            />
            <RoleSelect value={inviteRole} onChange={setInviteRole} />
            <Button className="h-10 rounded-2xl bg-blue-600 text-white" onClick={submitInvite}>
              <UserPlus className="mr-2 h-4 w-4" /> Convidar
            </Button>
          </div>

          {invites.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Convites pendentes
              </p>
              {invites.map((inv) => (
                <div key={inv.id} className="flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2">
                  <Mail className="h-3.5 w-3.5 text-slate-500" />
                  <span className="flex-1 truncate text-xs text-slate-300">{inv.email}</span>
                  <span className="text-[10px] font-semibold text-slate-500">{roleMeta(inv.role).label}</span>
                  <button onClick={() => app.cancelInvite(inv.email)} className="text-slate-500 hover:text-red-300">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </DarkCard>
      )}

      {/* Pendentes de aprovação */}
      {isAdmin && pending.length > 0 && (
        <DarkCard>
          <h2 className="text-lg font-bold text-white">Aguardando aprovação ({pending.length})</h2>
          <div className="mt-3 space-y-2">
            {pending.map((m) => (
              <div key={m.uid} className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3">
                <p className="text-sm font-medium text-white">{m.name || m.email}</p>
                <p className="mb-2 text-[11px] text-slate-500">{m.email}</p>
                <div className="flex items-center gap-2">
                  <PendingApprove app={app} member={m} />
                  <button
                    onClick={() => app.removeMemberAccount(m.uid)}
                    className="rounded-xl bg-slate-800 p-2 text-slate-400 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </DarkCard>
      )}

      {/* Membros ativos */}
      <DarkCard>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <h2 className="text-lg font-bold text-white">Membros ({active.length})</h2>
        </div>
        <div className="mt-3 space-y-2">
          {active.map((m) => {
            const meta = roleMeta(m.role);
            const Icon = meta.icon;
            const isSelf = m.uid === userId;
            return (
              <div key={m.uid} className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-sm font-bold text-white">
                  {(m.name || m.email)[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {m.name || m.email}{isSelf && <span className="text-slate-500"> (você)</span>}
                  </p>
                  <p className="truncate text-[11px] text-slate-500">{m.email}</p>
                </div>
                {isAdmin && !isSelf ? (
                  <>
                    <RoleSelect value={m.role} onChange={(r) => app.setMemberRole(m.uid, r)} />
                    <button
                      onClick={() => app.removeMemberAccount(m.uid)}
                      className="rounded-xl bg-slate-800 p-2 text-slate-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <span className={`flex items-center gap-1 text-xs font-semibold ${meta.tone}`}>
                    <Icon className="h-3.5 w-3.5" /> {meta.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </DarkCard>
    </div>
  );
}

function PendingApprove({ app, member }) {
  const [role, setRole] = useState("colaborador");
  return (
    <div className="flex flex-1 items-center gap-2">
      <RoleSelect value={role} onChange={setRole} />
      <Button
        className="h-9 flex-1 rounded-xl bg-emerald-600 text-white"
        onClick={() => app.approveMemberAccount(member.uid, role)}
      >
        <Check className="mr-1.5 h-4 w-4" /> Aprovar
      </Button>
    </div>
  );
}
