import type { ReactNode } from "react";

type FormattedTextProps = {
  text: string;
};

const inlinePattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;

function formatInlineMarkdown(text: string) {
  const nodes: ReactNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(inlinePattern)) {
    const token = match[0];
    const index = match.index ?? 0;

    if (index > cursor) nodes.push(text.slice(cursor, index));

    if (token.startsWith("**") && token.endsWith("**")) {
      nodes.push(<strong key={`${index}-strong`}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*") && token.endsWith("*")) {
      nodes.push(<em key={`${index}-em`}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith("`") && token.endsWith("`")) {
      nodes.push(<code key={`${index}-code`}>{token.slice(1, -1)}</code>);
    }

    cursor = index + token.length;
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));

  return nodes;
}

export function FormattedText({ text }: FormattedTextProps) {
  return <span className="formatted-inline">{formatInlineMarkdown(text)}</span>;
}
