import { FormattedText } from "./FormattedText";
import type { TextAlign } from "../lib/siteContent";

type SectionHeaderProps = {
  kicker: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  titleAlign?: TextAlign;
  descriptionAlign?: TextAlign;
};

export function SectionHeader({ kicker, title, description, align = "left", titleAlign = align, descriptionAlign = align }: SectionHeaderProps) {
  return (
    <div className={`section-head section-head-${align}`}>
      <div style={{ textAlign: titleAlign }}>
        <div className="section-kicker">{kicker}</div>
        <h2>{title}</h2>
      </div>
      {description ? <p className="section-desc" style={{ textAlign: descriptionAlign }}><FormattedText text={description} /></p> : null}
    </div>
  );
}
