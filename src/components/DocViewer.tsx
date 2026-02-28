import { Modal, ScrollArea } from "@mantine/core";
import { resolveResource } from "@tauri-apps/api/path";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { useCallback, useEffect, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function DocViewer({
  resource,
  title,
  onClose,
}: {
  resource: string | null;
  title: string;
  onClose: () => void;
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
              a: ({ node, ...props }) => (
                <a {...props} target="_blank" rel="noreferrer" />
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
