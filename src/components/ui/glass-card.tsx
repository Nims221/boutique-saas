import { ReactNode } from "react";

type GlassCardProps = {
  children: ReactNode;
  className?: string;
};

export function GlassCard({ children, className = "" }: GlassCardProps) {
  return (
    <div
      className={`app-card rounded-[28px] border app-border-soft ${className}`}
    >
      {children}
    </div>
  );
}