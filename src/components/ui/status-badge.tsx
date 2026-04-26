type Status =
  | "available"
  | "low"
  | "critical"
  | "Disponible"
  | "Faible"
  | "Critique"
  | "Payée"
  | "En attente"
  | "Brouillon"
  | "Commandé"
  | "Reçu";

const labelMap: Record<Status, string> = {
  available: "Disponible",
  low: "Faible",
  critical: "Critique",
  Disponible: "Disponible",
  Faible: "Faible",
  Critique: "Critique",
  Payée: "Payée",
  "En attente": "En attente",
  Brouillon: "Brouillon",
  Commandé: "Commandé",
  Reçu: "Reçu",
};

const classMap: Record<Status, string> = {
  available: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
  low: "bg-amber-400/10 text-amber-300 border-amber-400/20",
  critical: "bg-rose-400/10 text-rose-300 border-rose-400/20",
  Disponible: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
  Faible: "bg-amber-400/10 text-amber-300 border-amber-400/20",
  Critique: "bg-rose-400/10 text-rose-300 border-rose-400/20",
  Payée: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
  "En attente": "bg-amber-400/10 text-amber-300 border-amber-400/20",
  Brouillon: "bg-white/10 text-slate-300 border-white/10",
  Commandé: "bg-cyan-400/10 text-cyan-300 border-cyan-400/20",
  Reçu: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${classMap[status]}`}
    >
      {labelMap[status]}
    </span>
  );
}