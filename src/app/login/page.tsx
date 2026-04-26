import LoginForm from "../../components/auth/login-form";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <div className="mx-auto flex min-h-[80vh] max-w-6xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="hidden rounded-[32px] bg-gradient-to-br from-[#0d1b34] to-[#13284d] p-10 text-white shadow-2xl lg:block">
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/60">
              Boutique SaaS
            </p>

            <h1 className="mt-4 text-4xl font-semibold">
              Connecte-toi à ton espace de gestion
            </h1>

            <p className="mt-4 max-w-lg text-base text-white/70">
              Ventes, stock, produits, réapprovisionnement et suivi quotidien
              dans une seule interface.
            </p>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}