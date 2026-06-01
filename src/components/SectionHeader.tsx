type SectionHeaderProps = {
  kicker: string;
  title: string;
  description?: string;
  align?: "left" | "center";
};

export function SectionHeader({ kicker, title, description, align = "left" }: SectionHeaderProps) {
  return (
    <div className={`section-head section-head-${align}`}>
      <div>
        <div className="section-kicker">{kicker}</div>
        <h2>{title}</h2>
      </div>
      {description ? <p className="section-desc">{description}</p> : null}
    </div>
  );
}
