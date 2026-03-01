import { Anchor, Modal, Text } from "@mantine/core";
import { getTauriVersion, getVersion } from "@tauri-apps/api/app";
import { arch, version as OSVersion, type } from "@tauri-apps/plugin-os";
import { useEffect, useState } from "react";

function AboutModal({
  opened,
  setOpened,
}: {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [info, setInfo] = useState<{
    version: string;
    tauri: string;
    os: string;
    architecture: string;
    osVersion: string;
  } | null>(null);

  useEffect(() => {
    async function load() {
      const os = await type();
      const version = await getVersion();
      const tauri = await getTauriVersion();
      const architecture = await arch();
      const osVersion = await OSVersion();
      setInfo({ version, tauri, os, architecture, osVersion });
    }
    load();
  }, []);
  return (
    <Modal
      centered
      opened={opened}
      onClose={() => setOpened(false)}
      title="En Parlant~"
    >
      <Text>Version: {info?.version}</Text>
      <Text>Tauri version: {info?.tauri}</Text>
      <Text>
        OS: {info?.os} {info?.architecture} {info?.osVersion}
      </Text>

      <br />

      <Anchor
        href="https://github.com/DarrellThomas/en-parlant"
        target="_blank"
        rel="noreferrer"
      >
        github.com/DarrellThomas/en-parlant
      </Anchor>

      <br />

      <Text size="sm">
        Original En Croissant can be found at:{" "}
        <Anchor
          href="https://www.encroissant.org"
          target="_blank"
          rel="noreferrer"
        >
          www.encroissant.org
        </Anchor>
      </Text>

      <br />

      <Text size="sm">License: GPL-3.0</Text>
      <Text size="xs" c="dimmed">
        Based on En Croissant by Francisco Salgueiro. TTS narration by{" "}
        <Anchor
          href="mailto:darrell@redshed.ai"
          target="_blank"
          rel="noreferrer"
          size="xs"
          c="dimmed"
        >
          darrell@redshed.ai
        </Anchor>
      </Text>
    </Modal>
  );
}

export default AboutModal;
