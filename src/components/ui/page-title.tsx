export function PageTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/80">{eyebrow}</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">{description}</p>
    </div>
  );
}
