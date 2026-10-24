import { memo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const plugins = [remarkGfm];
const components: Components = {
  // Answers sit below the panel heading in the document outline.
  h1: ({ children }) => <h3>{children}</h3>,
  h2: ({ children }) => <h3>{children}</h3>,
  h3: ({ children }) => <h4>{children}</h4>,
  table: ({ children }) => (
    <figure className="chat-table">
      <figcaption>Scroll to see all columns</figcaption>
      <div role="region" aria-label="Answer table, scroll to see all columns" tabIndex={0}>
        <table>{children}</table>
      </div>
    </figure>
  ),
  th: ({ children, style }) => <th scope="col" style={style}>{children}</th>,
  pre: ({ children }) => <pre tabIndex={0} aria-label="Code block">{children}</pre>,
  a: ({ children, href, title, id, "aria-label": label, "aria-describedby": description }) => {
    if (!href) return <span>{children}</span>;
    const external = /^(https?:)?\/\//i.test(href);
    return (
      <a id={id} href={href} title={title} aria-label={label} aria-describedby={description} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>
        {children}{external && <span className="sr-only"> (opens in a new tab)</span>}
      </a>
    );
  },
  // Model-written image URLs should not load remote content in the conversation.
  img: ({ alt }) => alt ? <span>{alt}</span> : null,
};

/** GFM tables/lists with the parser's safe URL defaults; raw HTML is never executed. */
export default memo(function Markdown({ text }: { text: string }) {
  return (
    <div className="chat-markdown">
      <ReactMarkdown remarkPlugins={plugins} components={components} skipHtml>{text}</ReactMarkdown>
    </div>
  );
});
