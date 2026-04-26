"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/login/actions";

const initialState = {
  success: false,
  message: "",
};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(
    loginAction as any,
    initialState
  );

  return (
    <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
      <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
        Authentification
      </p>

      <h2 className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">
        Connexion
      </h2>

      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
        Saisis ton email et ton mot de passe pour accéder à l’application.
      </p>

      <form action={formAction} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm text-slate-600 dark:text-slate-300">
            Email
          </label>
          <input
            name="email"
            type="email"
            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            placeholder="admin@boutique.local"
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

        {state?.message ? (
          <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
            {state.message}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="h-11 w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
        >
          {pending ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </div>
  );
}