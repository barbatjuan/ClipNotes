import React from 'react';
import ReactMarkdown from 'react-markdown';

export function MarkdownSummary({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
