import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "ghost";
}

export function Button({
  children,
  variant = "primary",
  style,
  ...props
}: ButtonProps) {
  const base: React.CSSProperties = {
    borderRadius: 10,
    border: "1px solid transparent",
    padding: "0.55rem 1rem",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: {
      background: "linear-gradient(135deg, var(--atomic-cyan), var(--atomic-purple))",
      color: "#05070d",
      boxShadow: "var(--atomic-glow-cyan)",
    },
    ghost: {
      background: "transparent",
      color: "var(--atomic-cyan)",
      borderColor: "rgba(0, 229, 255, 0.35)",
    },
  };

  return (
    <button {...props} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}
