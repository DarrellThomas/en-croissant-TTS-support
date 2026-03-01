import { Modal, ScrollArea } from "@mantine/core";
import { resolveResource } from "@tauri-apps/api/path";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { open as shellOpen } from "@tauri-apps/plugin-shell";
import { useCallback, useEffect, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

function resolveRelativePath(base: string, relative: string): string {
  const baseParts = base.split("/");
  baseParts.pop(); // remove filename
  const relParts = relative.split("/");
  for (const part of relParts) {
    if (part === "..") {
      baseParts.pop();
    } else if (part !== ".") {
      baseParts.push(part);
    }
  }
  return baseParts.join("/");
}

export function DocViewer({
  resource,
  title,
  onClose,
  onNavigate,
}: {
  resource: string | null;
  title: string;
  onClose: () => void;
  onNavigate?: (resource: string, title: string) => void;
}) {
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!resource) return;
    setContent("");
    setError("");
    resolveResource(resource)
      .then((path) => readTextFile(path))
      .then((text) => setContent(text))
      .catch((e) => setError(`Failed to load: ${e}`));
  }, [resource]);

  const handleLinkClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string | undefined) => {
      if (!href) return;

      // External URLs → open in browser
      if (href.startsWith("http://") || href.startsWith("https://")) {
        e.preventDefault();
        shellOpen(href);
        return;
      }

      // Mailto links → open in browser (delegates to mail client)
      if (href.startsWith("mailto:")) {
        e.preventDefault();
        shellOpen(href);
        return;
      }

      // Relative .md links → navigate in-app
      if (href.endsWith(".md") && resource && onNavigate) {
        e.preventDefault();
        const resolved = resolveRelativePath(resource, href);
        // Derive a title from the link text or filename
        const filename = resolved.split("/").pop() || resolved;
        const displayTitle = filename
          .replace(/\.md$/, "")
          .replace(/[-_]/g, " ");
        onNavigate(resolved, displayTitle);
      }
    },
    [resource, onNavigate],
  );

  return (
    <Modal
      opened={!!resource}
      onClose={onClose}
      title={title}
      size="xl"
      styles={{
        body: { padding: "0 1rem 1rem" },
        header: { paddingBottom: 0 },
      }}
    >
      <ScrollArea h="70vh">
        {error ? (
          <p style={{ color: "red" }}>{error}</p>
        ) : (
          <Markdown
            components={{
              a: ({ node, href, ...props }) => (
                <a
                  {...props}
                  href={href}
                  onClick={(e) => handleLinkClick(e, href)}
                  target="_blank"
                  rel="noreferrer"
                />
              ),
            }}
            remarkPlugins={[remarkGfm]}
          >
            {content}
          </Markdown>
        )}
      </ScrollArea>
    </Modal>
  );
}
