
import DOMPurify from 'dompurify';
import React from 'react';

type Props = {
  html: string;
};

const cleanHtmlBlock = (html: string) => {
  // Elimina los delimitadores de bloque de código Markdown
  return html.replace(/^```html\n?/i, '').replace(/```$/i, '').trim();
};

export function SanitizedHTML({ html }: Props) {
  const cleaned = cleanHtmlBlock(html);
  return (
    <div
      className="summary-content"
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(cleaned) }}
    />
  );
}
