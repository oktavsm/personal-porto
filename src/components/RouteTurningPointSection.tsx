import { ArrowRight } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { bodyParagraphs, type CardBlock } from "../lib/siteContent";
import { FormattedText } from "./FormattedText";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";

type RouteTurningPointSectionProps = {
  id?: string;
  kicker?: string;
  title?: string;
  body?: string;
  highlightEnabled?: boolean;
  highlightText?: string;
  timelineEnabled?: boolean;
  pivotTitle?: string;
  pivotBody?: string;
  mediaEnabled?: boolean;
  mediaLayout?: "none" | "grid" | "carousel";
  mediaTitle?: string;
  mediaDescription?: string;
  ctaLabel?: string;
  ctaHref?: string;
  timelineItems: CardBlock[];
  mediaItems: CardBlock[];
};

function targetProps(href: string) {
  return href.startsWith("/") ? { to: href } : { href };
}

export function RouteTurningPointSection({
  id = "route-turning-point",
  kicker = "When the route changed",
  title = "One route closed.\nThe direction stayed.",
  body = "",
  highlightEnabled = true,
  highlightText = "The route changed.\nThe direction stayed.",
  timelineEnabled = true,
  pivotTitle = "So I rebuilt the route.",
  pivotBody = "",
  mediaEnabled = true,
  mediaLayout = "carousel",
  mediaTitle = "The route I continued through",
  mediaDescription = "Small moments from the beginning of my new route at Universitas Brawijaya.",
  ctaLabel = "Continue the story",
  ctaHref = "/#rebuilding-direction",
  timelineItems,
  mediaItems,
}: RouteTurningPointSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const titleLines = title.split("\n").filter(Boolean);
  const highlightLines = highlightText.split("\n").filter(Boolean);
  const pivotParagraphs = bodyParagraphs(pivotBody);
  const isCarousel = mediaLayout === "carousel" && mediaItems.length > 1;

  useEffect(() => {
    if (!isCarousel) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % mediaItems.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [isCarousel, mediaItems.length]);

  const clampedIndex = useMemo(() => Math.min(activeIndex, Math.max(mediaItems.length - 1, 0)), [activeIndex, mediaItems.length]);

  return (
    <section className="route-turning-section" id={id}>
      <div className="container route-turning-layout">
        <div className="route-turning-top">
          <Card className="route-turning-title-card">
            <div className="section-kicker">{kicker}</div>
            <h2>
              {titleLines.map((line, index) => (
                <Fragment key={line}>
                  {line}
                  {index < titleLines.length - 1 ? <br /> : null}
                </Fragment>
              ))}
            </h2>
          </Card>
          <div className="route-turning-copy">
            {bodyParagraphs(body).map((paragraph, index) => (
              <p className="section-desc with-space" key={`${paragraph}-${index}`}>
                <FormattedText text={paragraph} />
              </p>
            ))}
          </div>
        </div>

        {highlightEnabled && highlightText ? (
          <Card className="route-turning-highlight">
            <p>
              {highlightLines.map((line, index) => (
                <Fragment key={line}>
                  {line}
                  {index < highlightLines.length - 1 ? <br /> : null}
                </Fragment>
              ))}
            </p>
          </Card>
        ) : null}

        {timelineEnabled && timelineItems.length > 0 ? (
          <div className="route-turning-timeline" aria-label="Route turning point timeline">
            {timelineItems.map((item, index) => (
              <span className={index >= timelineItems.length - 2 ? "is-new-route" : index >= 3 ? "is-turning-point" : undefined} key={`${item.title}-${index}`}>
                {item.title}
              </span>
            ))}
          </div>
        ) : null}

        <div className="route-turning-pivot">
          <h3>{pivotTitle}</h3>
          <div>
            {pivotParagraphs.map((paragraph, index) => (
              <p className="section-desc with-space" key={`${paragraph}-${index}`}>
                <FormattedText text={paragraph} />
              </p>
            ))}
            {ctaLabel && ctaHref ? (
              <Button {...targetProps(ctaHref)} variant="primary">
                {ctaLabel} <ArrowRight size={16} />
              </Button>
            ) : null}
          </div>
        </div>

        {mediaEnabled && mediaLayout !== "none" && mediaItems.length > 0 ? (
          <div className="route-turning-media">
            <div className="route-turning-media-head">
              <div>
                <div className="section-kicker">{mediaTitle}</div>
                <p>{mediaDescription}</p>
              </div>
            </div>
            {isCarousel ? (
              <div className="route-turning-carousel">
                <div className="route-turning-carousel-track" style={{ transform: `translateX(-${clampedIndex * 100}%)` }}>
                  {mediaItems.map((item, index) => (
                    <figure className="route-turning-media-card" key={`${item.title}-${index}`}>
                      {item.imageUrl ? <img src={item.imageUrl} alt={item.title || "Early Universitas Brawijaya moment"} loading="lazy" /> : null}
                      <figcaption>
                        <strong>{item.title}</strong>
                        <span><FormattedText text={item.text} /></span>
                      </figcaption>
                    </figure>
                  ))}
                </div>
                <div className="route-turning-carousel-dots" aria-label="Route media slides">
                  {mediaItems.map((item, index) => (
                    <button
                      className={index === clampedIndex ? "is-active" : undefined}
                      type="button"
                      key={`${item.title}-dot-${index}`}
                      aria-label={`Show ${item.title}`}
                      onClick={() => setActiveIndex(index)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="route-turning-media-grid">
                {mediaItems.map((item, index) => (
                  <figure className="route-turning-media-card" key={`${item.title}-${index}`}>
                    {item.imageUrl ? <img src={item.imageUrl} alt={item.title || "Early Universitas Brawijaya moment"} loading="lazy" /> : null}
                    <figcaption>
                      <strong>{item.title}</strong>
                      <span><FormattedText text={item.text} /></span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
