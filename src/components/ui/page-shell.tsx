import type { ReactNode } from "react";

type PageShellProps = {
  children: ReactNode;
};

export function PageShell({ children }: PageShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#eef2ff_0%,_#f7f8fc_38%,_#f8fafc_100%)] text-slate-900">
      <div className="mx-auto max-w-[1520px] px-4 py-4 sm:px-5 lg:px-6">
        {children}
      </div>
    </div>
  );
}