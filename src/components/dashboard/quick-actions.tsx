import { GlassCard } from "@/components/ui/glass-card";

export function QuickActions() {
  const actions = [
    {
      title: "Nouvelle vente",
      description: "Encaisser une vente rapidement.",
    },
    {
      title: "Ajouter un produit",
      description: "Créer une nouvelle fiche produit.",
    },
    {
      title: "Réapprovisionner",
      description: "Préparer une commande fournisseur.",
    },
  ];

  return (
    <GlassCard className="p-5">
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-500">
          Actions rapides
        </p>
        <h3 className="mt-2 text-[28px] font-semibold app-text">
          Accès direct
        </h3>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {actions.map((action, index) => (
          <button
            key={`${action.title}-${index}`}
            className="group rounded-2xl border app-border-soft bg-gradient-to-br from-white to-slate-50 p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:border-indigo-100 hover:shadow-[0_14px_30px_rgba(79,70,229,0.10)] dark:from-slate-900 dark:to-slate-800 dark:hover:border-indigo-900/40"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-base font-semibold text-white shadow-sm">
              →
            </div>
            <h4 className="mt-3 text-base font-semibold app-text">
              {action.title}
            </h4>
            <p className="mt-2 text-sm leading-6 app-text-soft">
              {action.description}
            </p>
          </button>
        ))}
      </div>
    </GlassCard>
  );
}