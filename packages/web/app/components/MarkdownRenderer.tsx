'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize from 'rehype-sanitize';
import { Typography } from 'antd';
import styles from './MarkdownRenderer.module.css';

const { Text, Paragraph } = Typography;

/**
 * Preprocesses markdown content to handle single line breaks from LLMs
 * Converts single line breaks to double line breaks for proper markdown rendering
 */
function preprocessContent(content: string): string {
  return content
    // First, protect code blocks from processing
    .replace(/(```[\s\S]*?```)/g, (match) => {
      // Replace newlines in code blocks with a placeholder
      return match.replace(/\n/g, '__CODE_NEWLINE__');
    })
    // Handle single line breaks that aren't already double
    .replace(/(?<![\n\r])\n(?![\n\r])/g, '\n\n')
    // Restore code block newlines
    .replace(/__CODE_NEWLINE__/g, '\n')
    // Clean up any triple+ newlines back to double
    .replace(/\n{3,}/g, '\n\n');
}

interface MarkdownRendererProps {
  content: string;
  className?: string;
  preserveLineBreaks?: boolean;
}

export function MarkdownRenderer({ content, className, preserveLineBreaks = true }: MarkdownRendererProps) {
  if (!content || content.trim() === '') {
    return null;
  }

  // Preprocess content to handle single line breaks
  const processedContent = preserveLineBreaks ? preprocessContent(content) : content;
  const combinedClassName = `${styles.markdownRenderer} ${className || ''}`.trim();

  return (
    <div className={combinedClassName}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeSanitize]}
        components={{
          // Use simple div and let CSS handle styling
          p: ({ children }) => <p>{children}</p>,
          h1: ({ children }) => <h1>{children}</h1>,
          h2: ({ children }) => <h2>{children}</h2>,
          h3: ({ children }) => <h3>{children}</h3>,
          h4: ({ children }) => <h4>{children}</h4>,
          h5: ({ children }) => <h5>{children}</h5>,
          h6: ({ children }) => <h6>{children}</h6>,
          code: ({ children, className: codeClassName, ...props }) => {
            const isInline = !codeClassName;
            if (isInline) {
              return <Text code>{children}</Text>;
            }
            return (
              <pre>
                <code className={codeClassName} {...props}>
                  {children}
                </code>
              </pre>
            );
          },
          blockquote: ({ children }) => <blockquote>{children}</blockquote>,
          ul: ({ children }) => <ul>{children}</ul>,
          ol: ({ children }) => <ol>{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className={styles.tableWrapper}>
              <table>{children}</table>
            </div>
          ),
          th: ({ children }) => <th>{children}</th>,
          td: ({ children }) => <td>{children}</td>,
          hr: () => <hr />,
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
