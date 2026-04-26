"use client";

import { useActionState } from "react";
import { createUserAction, toggleUserStatusAction } from "@/app/utilisateurs/actions";
import type { AppUser } from "@/services/user.service";

const initialState = {
  success: false,
  message: "",
};

export default function UsersPanel({ users }: { users: AppUser[] }) {
  const [state, formAction, pending] = useActionState(
    createUserAction as any,
    initialState
  );

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Administration
          </p>
          <h2 className="mt-2 text-[26px] font-semibold text-slate-900 dark:text-white">
            Nouvel utilisateur
          </h2>

          <form action={formAction} className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-sm text-slate-600 dark:text-slate-300">
                Nom complet
              </label>
              <input
                name="full_name"
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                placeholder="Nom de l'utilisateur"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-600 dark:text-slate-300">
                Email
              </label>
              <input
                name="email"
                type="email"
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                placeholder="email@boutique.local"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-600 dark:text-slate-300">
                Mot de passe
              </label>
              <input
                name="password"
                type="password"
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-600 dark:text-slate-300">
                Rôle
              </label>
              <select
                name="role"
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                defaultValue="seller"
              >
                <option value="seller">Vendeur</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {state?.message ? (
              <div
                className={[
                  "rounded-2xl px-4 py-3 text-sm",
                  state.success
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                    : "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300",
                ].join(" ")}
              >
                {state.message}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={pending}
              className="h-11 w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-sm font-semibold text-white disabled:opacity-60"
            >
              {pending ? "Création..." : "Créer l'utilisateur"}
            </button>
          </form>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Utilisateurs
          </p>
          <h2 className="mt-2 text-[26px] font-semibold text-slate-900 dark:text-white">
            Liste des comptes
          </h2>

          <div className="mt-5 space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-950"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {user.full_name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {user.email}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300">
                      {user.role}
                    </span>
                    <span
                      className={[
                        "rounded-full px-3 py-1 text-xs",
                        user.is_active
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                          : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
                      ].join(" ")}
                    >
                      {user.is_active ? "Actif" : "Désactivé"}
                    </span>
                  </div>
                </div>

                <form action={toggleUserStatusAction}>
                  <input type="hidden" name="id" value={user.id} />
                  <input
                    type="hidden"
                    name="next_status"
                    value={user.is_active ? 0 : 1}
                  />
                  <button
                    type="submit"
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  >
                    {user.is_active ? "Désactiver" : "Activer"}
                  </button>
                </form>
              </div>
            ))}

            {users.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                Aucun utilisateur trouvé.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}