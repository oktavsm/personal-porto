import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  id?: string;
};

export function Card({ children, className = "", id }: CardProps) {
  return (
    <article className={`card ${className}`.trim()} id={id}>
      {children}
    </article>
  );
}
