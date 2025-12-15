import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import "highlight.js/styles/github-dark.css";

interface MarkdownMessageProps {
  content: string;
}

// Check if URL is a video
const isVideoUrl = (url: string): boolean => {
  const videoExtensions = [".mp4", ".webm", ".ogg", ".mov"];
  return videoExtensions.some((ext) => url.toLowerCase().includes(ext));
};

// Check if URL is an image
const isImageUrl = (url: string): boolean => {
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
  return imageExtensions.some((ext) => url.toLowerCase().includes(ext));
};

export function MarkdownMessage({ content }: MarkdownMessageProps) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          // Custom image rendering
          img({ src, alt, ...props }: any) {
            if (!src) return null;

            return (
              <figure className="my-4">
                <img
                  src={src}
                  alt={alt || "Image générée"}
                  className="rounded-lg max-w-full h-auto shadow-md"
                  loading="lazy"
                  {...props}
                />
                {alt && (
                  <figcaption className="text-center text-xs text-muted-foreground mt-2">
                    {alt}
                  </figcaption>
                )}
              </figure>
            );
          },
          // Custom video rendering
          video({ src, ...props }: any) {
            if (!src) return null;

            return (
              <figure className="my-4">
                <video
                  src={src}
                  controls
                  className="rounded-lg max-w-full shadow-md"
                  {...props}
                />
              </figure>
            );
          },
          // Custom link rendering - auto-embed images and videos
          a({ children, href, ...props }: any) {
            if (!href) {
              return <span>{children}</span>;
            }

            // If the link is an image URL, render as image
            if (isImageUrl(href)) {
              return (
                <figure className="my-4">
                  <img
                    src={href}
                    alt={typeof children === "string" ? children : "Image"}
                    className="rounded-lg max-w-full h-auto shadow-md cursor-pointer"
                    loading="lazy"
                    onClick={() => window.open(href, "_blank")}
                  />
                </figure>
              );
            }

            // If the link is a video URL, render as video
            if (isVideoUrl(href)) {
              return (
                <figure className="my-4">
                  <video
                    src={href}
                    controls
                    className="rounded-lg max-w-full shadow-md"
                  />
                </figure>
              );
            }

            // Regular link
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
          // Code blocks
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
          // Lists
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
          // Blockquotes
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
