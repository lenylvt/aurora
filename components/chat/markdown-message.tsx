import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import "highlight.js/styles/github-dark.css";

interface MarkdownMessageProps {
  content: string;
}

export function MarkdownMessage({ content }: MarkdownMessageProps) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
        // Personnaliser le rendu du code
        code({ node, inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || "");
          return !inline ? (
            <code className={className} {...props}>
              {children}
            </code>
          ) : (
            <code
              className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
              {...props}
            >
              {children}
            </code>
          );
        },
        // Style personnalisé pour les liens
        a({ children, href, ...props }: any) {
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:no-underline"
              {...props}
            >
              {children}
            </a>
          );
        },
        // Style pour les listes
        ul({ children, ...props }: any) {
          return (
            <ul className="list-disc list-inside space-y-1" {...props}>
              {children}
            </ul>
          );
        },
        ol({ children, ...props }: any) {
          return (
            <ol className="list-decimal list-inside space-y-1" {...props}>
              {children}
            </ol>
          );
        },
        // Style pour les citations
        blockquote({ children, ...props }: any) {
          return (
            <blockquote
              className="border-l-4 border-muted-foreground/20 pl-4 italic text-muted-foreground"
              {...props}
            >
              {children}
            </blockquote>
          );
        },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
