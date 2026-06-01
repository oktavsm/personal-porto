import { Link } from "react-router-dom";
import type { ReactNode } from "react";

type ButtonProps = {
  children: ReactNode;
  href?: string;
  to?: string;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
};

export function Button({ children, href, to, variant = "secondary", className = "" }: ButtonProps) {
  const classes = `btn btn-${variant} ${className}`.trim();

  if (to) {
    return (
      <Link className={classes} to={to}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a className={classes} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
        {children}
      </a>
    );
  }

  return <span className={classes}>{children}</span>;
}
