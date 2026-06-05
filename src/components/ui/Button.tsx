import { Link } from "react-router-dom";
import type { ReactNode } from "react";

type ButtonProps = {
  children: ReactNode;
  href?: string;
  to?: string;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  download?: boolean | string;
};

export function Button({ children, href, to, variant = "secondary", className = "", download }: ButtonProps) {
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
      <a
        className={classes}
        href={href}
        target={!download && href.startsWith("http") ? "_blank" : undefined}
        rel={!download && href.startsWith("http") ? "noreferrer" : undefined}
        download={download}
      >
        {children}
      </a>
    );
  }

  return <span className={classes}>{children}</span>;
}
